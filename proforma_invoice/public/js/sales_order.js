// Copyright (c) 2025, Diwakar and contributors
// For license information, please see license.txt

frappe.ui.form.on("Sales Order", {
    refresh: function(frm) {
        if (!frm.is_new() && frm.doc.docstatus === 1) {
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Proforma Invoice',
                    filters: { sales_order: frm.doc.name },
                    fields: ['name']
                },
                callback: function(r) {
                    if (!r.message || r.message.length === 0) {
                        frm.add_custom_button(__('Proforma Invoice'), function() {
                            frappe.model.open_mapped_doc({
                                method: "proforma_invoice.proforma_invoice.doctype.proforma_invoice.proforma_invoice.make_proforma_invoice_from_sales_order",
                                frm: frm
                            });
                        }, __('Create'));
                    }
                }
            });
        }
    }
});
