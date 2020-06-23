openerp.pos_order_mgmt = function (instance) {
    var module = instance.point_of_sale;

    pos_order_mgmt_models(instance, module);
    pos_order_mgmt_screens(instance, module);
    pos_order_mgmt_widgets(instance, module);
};
