import frappe
from frappe import _
from frappe.utils import flt, getdate
from frappe.model.mapper import get_mapped_doc
from erpnext.controllers.selling_controller import SellingController


class ProformaInvoice(SellingController):

    def validate(self):
        for tax in self.taxes:
            if not hasattr(tax, 'category') or tax.category is None:
                tax.category = "Total"  # default safe value
                tax.add_deduct_tax = "Add"
            
        super().validate()

        self.validate_dates()
        self.validate_items()
        self.outstanding_amount = self.rounded_total

    def validate_dates(self):
        if self.posting_date and getdate(self.posting_date) > getdate():
            frappe.throw(_("Posting Date cannot be future"))

        if self.due_date and getdate(self.due_date) < getdate(self.posting_date):
            frappe.throw(_("Due Date cannot be before Posting Date"))

    def validate_items(self):
        if not self.items:
            frappe.throw(_("Please add items"))

        for d in self.items:
            if not d.item_code:
                frappe.throw(_("Row {0}: Item required").format(d.idx))

            if flt(d.qty) <= 0:
                frappe.throw(_("Row {0}: Qty must be > 0").format(d.idx))

    def on_submit(self):
        pass

@frappe.whitelist()
def make_proforma_invoice_from_sales_order(source_name, target_doc=None):

    def set_missing_values(source, target):
        target.so_reference = source.name

    doc = get_mapped_doc(
        "Sales Order",
        source_name,
        {
            "Sales Order": {
                "doctype": "Proforma Invoice",
                "field_map": {
                    "name": "sales_order",
                    "customer": "customer",
                    "company": "company"
                }
            },
            "Sales Order Item": {
                "doctype": "Proforma Invoice Item",
                "field_map": {
                    "name": "so_detail",
                    "parent": "sales_order"
                }  
            }
        },
        target_doc,
        set_missing_values
    )

    return doc