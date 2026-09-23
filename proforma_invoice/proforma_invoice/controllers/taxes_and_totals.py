# apps/proforma_invoice/proforma_invoice/controllers/taxes_and_totals.py
from contextlib import contextmanager

from erpnext.controllers.taxes_and_totals import calculate_taxes_and_totals


@contextmanager
def treat_as(doc, doctype):
	"""Temporarily present doc as another doctype for ERPNext's hardcoded doctype checks."""
	original = doc.doctype
	_ = doc.meta  # load and cache Proforma Invoice meta before swapping
	doc.doctype = doctype
	try:
		yield
	finally:
		doc.doctype = original


class ProformaTaxesAndTotals(calculate_taxes_and_totals):
	def calculate_totals(self):
		# Run ERPNext's selling branch instead of the buying one
		with treat_as(self.doc, "Sales Invoice"):
			super().calculate_totals()