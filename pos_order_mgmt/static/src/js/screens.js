function pos_order_mgmt_screens(instance, module) {

    var QWeb = instance.web.qweb,
    _t = instance.web._t;


    module.OrderListScreenWidget = module.ScreenWidget.extend({
        template: 'OrderListScreenWidget',
        model: 'pos.order',
        auto_back: true,

        init: function(parent, options){
            this._super(parent, options);

            // this.order_cache = new DomCache();
            pos = this.pos;
            this.order_cache = [];
            this.orders = [];
            this.unknown_products = [];
            this.search_query = false;
            this.perform_search();
        },

        renderElement: function() {
            this._super();
            var self = this;

            // register handlers
            this.$('.back').click(function () {
                self.pos_widget.screen_selector.back();
            });

            if(this.pos.config.iface_vkeyboard &&
                this.pos_widget.onscreen_keyboard){
                this.pos_widget.onscreen_keyboard.connect(this.$('.searchbox input'));
            }

            var search_timeout = null;
            this.$('.searchbox input').on('keyup', function () {
                self.search_query = this.value;
                clearTimeout(search_timeout);
                search_timeout = setTimeout(function () {
                    self.perform_search();
                }, 70);
            });

            this.$('.searchbox .search-clear').click(function () {
                self.clear_search();
            });
        },

        show: function() {
            // in receipt screen we not allow di show order list screen
            var previous_screen = this.pos.get_order().get_screen_data('previous-screen');
            if (previous_screen === 'receipt') {
                this.hide();

                // finish current order, yet validate and printed
                this.pos.get('selectedOrder').destroy();
            }
            else {
                this._super();

                // perform empty search to fill list with last orders
                this.perform_search();
            }
        },

        render_list: function(orders){
            var self = this;
            var contents = this.$el[0].querySelector('.order-list-contents');
            contents.innerHTML = "";

            var line_list = document.createDocumentFragment();
            _.each(orders, function(order){
                var order_line_html = QWeb.render('OrderLine', {widget: this, order: order});
                var order_line = document.createElement('tbody');
                order_line.innerHTML = order_line_html;
                order_line = order_line.childNodes[1];
                line_list.appendChild(order_line);
            });
            contents.appendChild(line_list);

            // Every time the list is rendered we need to re-assign button events.
            this.$('.order-list-return').off('click');
            this.$('.order-list-reprint').off('click');
            this.$('.order-list-copy').off('click');

            this.$('.order-list-reprint').click(function (event) {
                self.order_list_actions(event, 'print');
            });
            this.$('.order-list-copy').click(function (event) {
                self.order_list_actions(event, 'copy');
            });
            this.$('.order-list-return').click(function (event) {
                self.order_list_actions(event, 'return');
            });
        },

        order_list_actions: function (event, action) {
            var self = this;
            var dataset = event.target.parentNode.dataset;
            self.load_order_data(parseInt(dataset.orderId, 10))
                .then(function (order_data) {
                    self.order_action(order_data, action);
                });
        },

        order_action: function (order_data, action) {
            var order = this.load_order_from_data(order_data, action);
            if (!order) {
                // The load of the order failed. (products not found, ...
                // We cancel the action
                return;
            }
            // force go-back to remove the order-list screen in the current order
            this.pos_widget.screen_selector.back();

            // launch required action and the result can be a new order when in copy/refund case
            this['action_' + action](order_data, order);
        },

        action_print: function (order_data, order) {
            var self = this;

            if(this.pos.config.iface_print_via_proxy){
                var receipt = order.export_for_printing();
                this.pos.proxy.print_receipt(QWeb.render('XmlReceipt',
                    {receipt: receipt, widget: self,})
                );

                // finish order and go back to scan screen
                // this.pos.get('selectedOrder').destroy();
                // destroy() is not required because when iface_print_via_proxy=true
                // the receipt is generated directly by the order param and not
                // from this.pos.set('selectedOrder', order)

            } else {
                // FIXME After receipt is shown, 'Next order' button don't do anything
                this.pos.set('selectedOrder', order);
                this.pos_widget.screen_selector.set_current_screen('receipt');
            }
        },

        action_copy: function (order_data, order) {
            order.trigger('change');
            this.pos.get('orders').add(order);
            this.pos.set('selectedOrder', order);
            return order;
        },

        action_return: function (order_data, order) {
            order.trigger('change');
            this.pos.get('orders').add(order);
            this.pos.set('selectedOrder', order);
            return order;
        },

        _prepare_order_from_order_data: function (order_data, action) {
            var self = this;
            var order = new module.Order({pos:this.pos});

            // Set Generic Info
            order.backoffice_pos_reference = order_data.pos_reference;

            // Get Customer
            if (order_data.partner_id) {
                order.set_client(this.pos.db.get_partner_by_id(order_data.partner_id));
            }

            // Get order lines
            self._prepare_orderlines_from_order_data(order, order_data, action);

            // Get Name
            if (['print'].indexOf(action) !== -1) {
                order.name = order_data.pos_reference;
            } else if (['return'].indexOf(action) !== -1) {
                order.name = _t("Refund ") + order.uid;
            }

            // Get to invoice
            // if (['return', 'copy'].indexOf(action) !== -1) {
                // If previous order was invoiced, we need a refund too
                // order.set_to_invoice(order_data.to_invoice);
            // }

            // Get returned Order
            if (['print'].indexOf(action) !== -1) {
                // Get the same value as the original
                order.returned_order_id = order_data.returned_order_id;
                order.returned_order_reference = order_data.returned_order_reference;
            } else if (['return'].indexOf(action) !== -1) {
                order.returned_order_id = order_data.id;
                order.returned_order_reference = order_data.pos_reference;
            }

            // Get Date
            // if (['print'].indexOf(action) !== -1) {
                // order.formatted_validation_date =
                // moment(order_data.date_order).format('YYYY-MM-DD HH:mm:ss');
            // }

            // Get Payment lines
            if (['print'].indexOf(action) !== -1) {
                var paymentLines = order_data.statement_ids || [];
                _.each(paymentLines, function (paymentLine) {
                    var line = paymentLine;
                    // In case of local data
                    if (line.length === 3) {
                        line = line[2];
                    }
                    _.each(self.pos.cashregisters, function (cashregister) {
                        if (cashregister.journal.id === line.journal_id) {
                            if (line.amount > 0) {
                                // If it is not change
                                order.addPaymentline(cashregister);
                                order.selected_paymentline.set_amount(line.amount);
                            }
                        }
                    });
                });
            }
            return order;
        },

        _prepare_orderlines_from_order_data: function (order, order_data, action) {
            var orderLines = order_data.line_ids || order_data.lines || [];

            var self = this;
            _.each(orderLines, function (orderLine) {
                var line = orderLine;
                // In case of local data
                if (line.length === 3) {
                    line = line[2];
                }
                var product = self.pos.db.get_product_by_id(line.product_id);
                // Check if product are available in pos
                if (_.isUndefined(product)) {
                    self.unknown_products.push(String(line.product_id));
                } else {
                    // Create a new order line
                    order.addProduct(product, self._prepare_product_options_from_orderline_data( order, line, action));
                }
            });
        },

        _prepare_product_options_from_orderline_data: function (order, line, action) {

            var qty = line.qty;
            if (['return'].indexOf(action) !== -1) {
                // Invert line quantities
                qty *= -1;
            }
            return {
                price: line.price_unit,
                quantity: qty,
                discount: line.discount,
                merge: false,
            }

        },

        load_order_data: function (order_id) {
            var self = this;
            var posOrderModel = new instance.web.Model(this.model);
            return posOrderModel.call('load_done_order_for_pos', [order_id])
            .fail(function (error) {
                if (parseInt(error.code, 10) === 200) {
                    // Business Logic Error, not a connection problem
                    self.pos_widget.screen_selector.show_popup(
                        'error-traceback',
                        {
                            'title': error.data.message,
                            'body': error.data.debug,
                        }
                    );
                } else {
                    self.pos_widget.screen_selector.show_popup(
                        'error',
                        {
                            'title': _t('Connection error'),
                            'body': _t('Can not execute this action because the POS' +
                                ' is currently offline'),
                        }
                    );
                }
            });
        },

        load_order_from_data: function (order_data, action) {
            var self = this;
            this.unknown_products = [];
            var order = self._prepare_order_from_order_data(
                order_data, action);
            // Forbid POS Order loading if some products are unknown
            if (self.unknown_products.length > 0) {
                self.pos_widget.screen_selector.show_popup(
                    'error-traceback',
                    {
                        'title': _t('Unknown Products'),
                        'body': _t('Unable to load some order lines because the ' +
                            'products are not available in the POS cache.\n\n' +
                            'Please check that lines :\n\n  * ') +
                        self.unknown_products.join("; \n  *"),
                    }
                );

                return false;
            }
            return order;
        },

        // Search Part
        search_done_orders: function (query) {
            var self = this;
            var posOrderModel = new instance.web.Model(this.model);
            return posOrderModel.call('search_done_orders_for_pos', [query || '', this.pos.pos_session.id])
            .then(function (result) {
                self.orders = result;
                _.each(result, function(order) {
                    order.amount_total_display = self.format_currency(order.amount_total);
                });

                self.render_list(result);

            }).fail(function (error, event) {
                if (parseInt(error.code, 10) === 200) {
                    // Business Logic Error, not a connection problem
                    self.pos_widget.screen_selector.show_popup(
                        'error-traceback',
                        {
                            message: error.data.message,
                            comment: error.data.debug
                        }
                    );
                } else {
                    self.pos_widget.screen_selector.show_popup(
                        'error',
                        {
                            message: _t('Connection error'),
                            comment: _t('Can not execute this action because the POS is currently offline'),
                        }
                    );
                }
                event.preventDefault();
            });
        },

        perform_search: function () {
            return this.search_done_orders(this.search_query);
        },

        clear_search: function () {
            var self = this;
            self.$('.searchbox input')[0].value = '';
            self.$('.searchbox input').focus();
            self.search_query = false;
            self.perform_search();
        },

    });

}