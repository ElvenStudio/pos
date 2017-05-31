# -*- coding: utf-8 -*-
# Copyright (C) 2017 - Today: ElvenStudio (http://www.elvenstudio.it)
# @author: Domenico Stragapede  (d.stragapede@elvenstudio.it)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from openerp import api, fields, models
import openerp.addons.decimal_precision as dp


class PosSession(models.Model):
    _inherit = 'pos.session'

    # Columns Section
    margin = fields.Float(
        'Margin', compute='_compute_margin', store=True,
        digits_compute=dp.get_precision('Product Price'),
        help="It gives profitability by calculating the sum of all order margins.")

    # Compute Section
    @api.multi
    @api.depends('order_ids.margin')
    def _compute_margin(self):
        for session in self:
            session.margin = sum([order.margin for order in session.order_ids])
