function pos_order_mgmt_widgets(instance, module) {

    module.ListOrderButtonWidget = module.PosBaseWidget.extend({
        template: 'ListOrderButtonWidget',
        init: function (parent, options) {
            var opts = options || {};
            this._super(parent, opts);
            this.action = opts.action;
            this.label = opts.label;
        },

        button_click: function () {
            var screen_selector = this.pos.pos_widget.screen_selector;
            screen_selector.set_current_screen('orderlist');
        },

        renderElement: function () {
            var self = this;
            this._super();
            this.$el.click(function () {
                self.button_click();
            });
        },
    });


    module.PosWidget = module.PosWidget.extend({

        build_widgets: function() {
            this._super();

            if (this.pos.config.iface_order_mgmt) {
                // build OrderListScreenWidget
                this.order_list_screen = new module.OrderListScreenWidget(this, {});
                this.order_list_screen.appendTo(this.$('.screens'));
                this.order_list_screen.hide();
                this.screen_selector.screen_set['orderlist'] = this.order_list_screen;

                // build ListOrderButtonWidget
                this.list_order_button_widget = new module.ListOrderButtonWidget(this, {});
                this.list_order_button_widget.appendTo(this.$('.pos-rightheader'));
            }
        },
    });

}


