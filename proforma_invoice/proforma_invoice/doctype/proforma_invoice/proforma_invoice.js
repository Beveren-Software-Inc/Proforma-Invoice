erpnext.sales_common.setup_selling_controller();
extend_cscript(cur_frm.cscript, new erpnext.selling.SellingController({ frm: cur_frm }));

frappe.ui.form.on("Proforma Invoice", {

    calculate_taxes_and_totals(frm) {
        // wait for totals update
        setTimeout(() => {
            update_payment_schedule(frm);
        }, 300);
    },

    setup(frm) {
        frm.set_query("customer", erpnext.queries.customer);

        frm.set_query("additional_discount_account", () => ({
            filters: {
                company: frm.doc.company,
                is_group: 0,
                report_type: "Profit and Loss"
            }
        }));
    },

    onload(frm) {
        if (!frm.doc.posting_date) {
            frm.set_value("posting_date", frappe.datetime.get_today());
        }
    },

    refresh(frm) {
        frm.toggle_display("additional_discount_account", frm.doc.is_cash_or_non_trade_discount);
    },

    customer(frm) {
        if (!frm.doc.customer) return;

        erpnext.utils.get_party_details(
            frm,
            "erpnext.accounts.party.get_party_details",
            {
                party: frm.doc.customer,
                party_type: "Customer",
                company: frm.doc.company,
                posting_date: frm.doc.posting_date
            },
            () => {
                frm.trigger("calculate_taxes_and_totals");
            }
        );
    },

    selling_price_list(frm) {
        frm.trigger("calculate_taxes_and_totals");
    },

    taxes_and_charges(frm) {
        frm.trigger("calculate_taxes_and_totals");
        if (frm.doc.taxes_and_charges) {
            frappe.call({
                method: "erpnext.controllers.accounts_controller.get_taxes_and_charges",
                args: {
                    master_doctype: "Sales Taxes and Charges Template",
                    master_name: frm.doc.taxes_and_charges
                },
                callback(r) {
                    if (r.message) {
                        frm.set_value("taxes", r.message);
                        frm.trigger("calculate_taxes_and_totals");
                    }
                }
            });
        }
    },

    additional_discount_percentage(frm) {
        frm.trigger("calculate_taxes_and_totals");
    },

    discount_amount(frm) {
        frm.trigger("calculate_taxes_and_totals");
    },

    apply_discount_on(frm) {
        frm.trigger("calculate_taxes_and_totals");
    },

    payment_terms_template(frm) {
        if (frm.doc.payment_terms_template) {
            frm.call({
                method: "erpnext.controllers.accounts_controller.get_payment_terms",
                args: {
                    terms_template: frm.doc.payment_terms_template,
                    posting_date: frm.doc.posting_date,
                    grand_total: frm.doc.grand_total
                },
                callback(r) {
                    if (r.message) {
                        frm.clear_table("payment_schedule");
                        r.message.forEach(row => {
                            let d = frm.add_child("payment_schedule");
                            Object.assign(d, row);
                        });
                        frm.refresh_field("payment_schedule");
                    }
                }
            });
        }
    },

    grand_total(frm) {
        frm.trigger("payment_terms_template");
        frm.trigger("set_payment_schedule");
        frm.refresh_field("payment_schedule");
    },

    set_payment_schedule(frm) {
        if (!frm.doc.payment_terms_template) return;

        frm.call({
            method: "erpnext.controllers.accounts_controller.get_payment_terms",
            args: {
                terms_template: frm.doc.payment_terms_template,
                posting_date: frm.doc.posting_date,
                grand_total: frm.doc.grand_total
            },
            callback(r) {
                if (r.message) {
                    frm.clear_table("payment_schedule");

                    r.message.forEach(row => {
                        let d = frm.add_child("payment_schedule");
                        Object.assign(d, row);
                    });

                    frm.refresh_field("payment_schedule");
                }
            }
        });
    }
});


frappe.ui.form.on("Proforma Invoice Item", {

    item_code(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        frappe.call({
            method: "erpnext.stock.get_item_details.get_item_details",
            args: {
                args: {
                    item_code: row.item_code,
                    customer: frm.doc.customer,
                    company: frm.doc.company,
                    currency: frm.doc.currency,
                    price_list: frm.doc.selling_price_list,
                    doctype: frm.doc.doctype,
                    qty: row.qty || 1
                },
                doc: frm.doc
            },
            callback(r) {
                if (r.message) {
                    frappe.model.set_value(cdt, cdn, {
                        rate: r.message.price_list_rate || 0,
                        qty: r.message.qty || 1
                    });

                    frm.trigger("calculate_taxes_and_totals");
                }
            }
        });
    },

    qty(frm) {
        frm.trigger("calculate_taxes_and_totals");
    },

    rate(frm) {
        frm.trigger("calculate_taxes_and_totals");
    },

    discount_percentage(frm) {
        frm.trigger("calculate_taxes_and_totals");
    }
});


frappe.ui.form.on("Sales Taxes and Charges", {

    rate(frm) {
        frm.trigger("calculate_taxes_and_totals");
    },

    tax_amount(frm) {
        frm.trigger("calculate_taxes_and_totals");
    }
});


function update_payment_schedule(frm) {
    if (!frm.doc.payment_terms_template) return;

    frm.call({
        method: "erpnext.controllers.accounts_controller.get_payment_terms",
        args: {
            terms_template: frm.doc.payment_terms_template,
            posting_date: frm.doc.posting_date,
            grand_total: frm.doc.grand_total
        },
        callback(r) {
            if (r.message) {
                frm.clear_table("payment_schedule");

                r.message.forEach(row => {
                    let d = frm.add_child("payment_schedule");
                    Object.assign(d, row);
                });

                frm.refresh_field("payment_schedule");
            }
        }
    });
}