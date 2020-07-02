function pos_order_mgmt_models(instance, module) {

    var order_super = module.Order.prototype;

    module.Order = module.Order.extend({
        export_as_JSON: function () {
            var res = order_super.export_as_JSON.apply(this, arguments);
            res.returned_order_id = this.returned_order_id;
            res.returned_order_reference = this.returned_order_reference;
            return res;
        },
        export_for_printing: function () {
            var res = order_super.export_for_printing.apply(this, arguments);
            res.returned_order_id = this.returned_order_id;
            res.returned_order_reference = this.returned_order_reference;
            return res;
        },
    });
}
