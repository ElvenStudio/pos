
from openerp.osv import osv, fields
import openerp.addons.decimal_precision as dp
import logging

_log = logging.getLogger(__name__)


class PosOrder(osv.osv):
    _inherit = "pos.order"

    def _amount_all(self, cr, uid, ids, name, args, context=None):
        cur_obj = self.pool.get('res.currency')
        res = super(PosOrder, self)._amount_all(cr, uid, ids, name, args, context=context)
        # _log.warning(res)

        for order in self.browse(cr, uid, ids, context=context):
            cur = order.pricelist_id.currency_id
            res[order.id]['amount_total'] = 0
            for line in order.lines:
                res[order.id]['amount_total'] += cur_obj.round(cr, uid, cur, line.price_subtotal_incl)
        return res

    _columns = {
        'amount_total': fields.function(_amount_all, string='Total', digits_compute=dp.get_precision('Account'),  multi='all'),
    }
