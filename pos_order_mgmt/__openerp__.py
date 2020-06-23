# -*- coding: utf-8 -*-
##############################################################################
#
#    Author: ElvenStudio
#    Copyright 2015 elvenstudio.it
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################

{
    'name': 'POS order management',
    'summary': 'Manage old POS Orders from the frontend',
    'category': 'Point of Sale',
    'version': '8.0.1.0.0',
    'author': 'Elvenstudio, '
              'GRAP, '
              'Tecnativa, '
              'Odoo Community Association (OCA)',
    'license': 'AGPL-3',
    'website': 'http://www.elvenstudio.it',

    'depends': [
        'point_of_sale',
    ],

    'data': [
        'views/assets.xml',
        'views/view_pos_config.xml',
        'views/view_pos_order.xml',
    ],

    'qweb': [
        'static/src/xml/pos.xml'
    ],

    'installable': True,
    'application': False,
}
