/**
 * BillBook SaaS - Core Application Engine & Features
 * Author: Joy John
 */

(function () {
  'use strict';

  let appData = null;
  let activeTab = 'dashboard';
  let posCart = [];

  // Helper: Format Currency (INR)
  function formatINR(val) {
    if (val === null || val === undefined || isNaN(val)) return '₹0.00';
    return '₹' + Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Helper: Number to Indian Currency Words
  function numberToWordsINR(amount) {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertTwoDigits(n) {
      if (n === 0) return '';
      if (n < 10) return units[n];
      if (n < 20) return teens[n - 10];
      const t = Math.floor(n / 10);
      const u = n % 10;
      return tens[t] + (u > 0 ? ' ' + units[u] : '');
    }

    function convertThreeDigits(n) {
      const h = Math.floor(n / 100);
      const rem = n % 100;
      let str = '';
      if (h > 0) str += units[h] + ' Hundred';
      if (rem > 0) {
        if (str) str += ' and ';
        str += convertTwoDigits(rem);
      }
      return str;
    }

    const num = Math.floor(amount);
    const paise = Math.round((amount - num) * 100);
    if (num === 0 && paise === 0) return 'Rupees Zero Only';

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const hundred = num % 1000;

    let res = [];
    if (crore > 0) res.push(convertThreeDigits(crore) + ' Crore');
    if (lakh > 0) res.push(convertThreeDigits(lakh) + ' Lakh');
    if (thousand > 0) res.push(convertThreeDigits(thousand) + ' Thousand');
    if (hundred > 0) res.push(convertThreeDigits(hundred));

    let finalStr = 'Rupees ' + res.join(' ');
    if (paise > 0) {
      finalStr += ' and ' + convertTwoDigits(paise) + ' Paise';
    }
    return finalStr + ' Only';
  }

  // Initialize Application
  async function initApp() {
    appData = await window.CloudSync.init();
    if (!appData) {
      console.error('Failed to load application data');
      return;
    }

    setupNavigation();
    renderHeaderInfo();
    renderDashboard();
    renderInvoicesTable();
    renderItemsTable();
    renderPartiesTable();
    renderPurchasesTable();
    renderPOS();
    renderReports();
    renderSubscription();
    renderSettings();
    setupEventListeners();
  }

  // Setup Navigation Tabs
  function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const tabTarget = link.getAttribute('data-tab');
        if (tabTarget) {
          switchTab(tabTarget);
        }
      });
    });
  }

  function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === `tab-${tabId}`);
    });

    if (tabId === 'pos') renderPOS();
    if (tabId === 'dashboard') renderDashboard();
    if (tabId === 'invoices') renderInvoicesTable();
    if (tabId === 'items') renderItemsTable();
    if (tabId === 'parties') renderPartiesTable();
    if (tabId === 'reports') renderReports();
  }

  // Render Top Header Business Info
  function renderHeaderInfo() {
    const biz = appData.business || {};
    const sub = appData.subscription || {};

    const bizNameEl = document.getElementById('headerBizName');
    if (bizNameEl) bizNameEl.textContent = biz.name || 'Adonai Enterprises';

    const subBadgeEl = document.getElementById('sidebarSubPlan');
    if (subBadgeEl) subBadgeEl.textContent = sub.planName || 'Pro Max Plan';

    const subExpiryEl = document.getElementById('sidebarSubExpiry');
    if (subExpiryEl) subExpiryEl.textContent = `${sub.daysRemaining || 365} Days Remaining`;
  }

  // Render Dashboard
  function renderDashboard() {
    const invoices = appData.invoices || [];
    const purchases = appData.purchases || [];
    const parties = appData.parties || [];
    const items = appData.items || [];

    let totalSales = invoices.reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
    let totalPaid = invoices.reduce((sum, i) => sum + (Number(i.amountPaid) || 0), 0);
    let totalPurchases = purchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
    let toCollect = parties.filter(p => p.balanceType === 'receivable').reduce((s, p) => s + (p.currentBalance || 0), 0);
    let toPay = parties.filter(p => p.balanceType === 'payable').reduce((s, p) => s + (p.currentBalance || 0), 0);
    let lowStockCount = items.filter(it => it.stock <= it.minStock).length;

    document.getElementById('statTotalSales').textContent = formatINR(totalSales);
    document.getElementById('statToCollect').textContent = formatINR(toCollect);
    document.getElementById('statToPay').textContent = formatINR(toPay);
    document.getElementById('statCashBank').textContent = formatINR(totalPaid - 23150); // net after expenses
    document.getElementById('statLowStockCount').textContent = lowStockCount;

    // Recent Invoices Table
    const recentTbody = document.getElementById('recentInvoicesTbody');
    if (recentTbody) {
      recentTbody.innerHTML = '';
      invoices.slice(0, 5).forEach(inv => {
        const tr = document.createElement('tr');
        const badgeClass = inv.status === 'Paid' ? 'badge-paid' : inv.status === 'Partial' ? 'badge-partial' : 'badge-unpaid';
        tr.innerHTML = `
          <td><strong>${inv.invoiceNumber}</strong></td>
          <td>${inv.partyName}</td>
          <td>${inv.date}</td>
          <td>${formatINR(inv.grandTotal)}</td>
          <td><span class="badge ${badgeClass}">${inv.status}</span></td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="window.App.viewInvoice('${inv.id}')">View & Print</button>
          </td>
        `;
        recentTbody.appendChild(tr);
      });
    }
  }

  // Render Invoices Table
  function renderInvoicesTable() {
    const tbody = document.getElementById('invoicesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const invoices = appData.invoices || [];
    invoices.forEach(inv => {
      const tr = document.createElement('tr');
      const badgeClass = inv.status === 'Paid' ? 'badge-paid' : inv.status === 'Partial' ? 'badge-partial' : 'badge-unpaid';
      tr.innerHTML = `
        <td><strong>${inv.invoiceNumber}</strong></td>
        <td>${inv.date}</td>
        <td>
          <div><strong>${inv.partyName}</strong></div>
          <small class="text-muted">${inv.partyGstin || 'Unregistered'}</small>
        </td>
        <td>${formatINR(inv.grandTotal)}</td>
        <td>${formatINR(inv.amountPaid)}</td>
        <td><strong style="color: ${inv.balanceDue > 0 ? 'var(--danger)' : 'var(--success)'}">${formatINR(inv.balanceDue)}</strong></td>
        <td><span class="badge ${badgeClass}">${inv.status}</span></td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn btn-sm btn-primary" onclick="window.App.viewInvoice('${inv.id}')">Invoice</button>
            <button class="btn btn-sm btn-outline" onclick="window.App.shareWhatsApp('${inv.id}')">WhatsApp</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Render Items Table
  function renderItemsTable() {
    const tbody = document.getElementById('itemsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const items = appData.items || [];
    items.forEach(item => {
      const isLow = item.stock <= item.minStock;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong>${item.name}</strong>
          <div class="text-muted" style="font-size:0.75rem;">Code: ${item.code} | Barcode: ${item.barcode}</div>
        </td>
        <td>${item.category}</td>
        <td>${item.hsn}</td>
        <td>${formatINR(item.salePrice)}</td>
        <td>${formatINR(item.purchasePrice)}</td>
        <td>
          <span style="font-weight:600; color: ${isLow ? 'var(--danger)' : 'var(--success)'}">
            ${item.stock} ${item.unit}
          </span>
          ${isLow ? '<span class="badge badge-unpaid" style="margin-left:4px;">Low</span>' : ''}
        </td>
        <td>${item.taxRate}% GST</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="window.App.adjustStock('${item.id}')">Adjust Stock</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Render Parties Table
  function renderPartiesTable() {
    const tbody = document.getElementById('partiesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const parties = appData.parties || [];
    parties.forEach(p => {
      const isCustomer = p.type === 'Customer';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong>${p.name}</strong>
          <div class="text-muted" style="font-size:0.75rem;">${p.contactPerson} | ${p.phone}</div>
        </td>
        <td><span class="badge ${isCustomer ? 'badge-paid' : 'badge-partial'}">${p.type}</span></td>
        <td>${p.gstin || 'None'}</td>
        <td>${p.state}</td>
        <td>
          <strong style="color: ${p.balanceType === 'receivable' ? 'var(--success)' : 'var(--danger)'}">
            ${formatINR(p.currentBalance)}
          </strong>
          <div class="text-muted" style="font-size:0.7rem; text-transform:uppercase;">${p.balanceType}</div>
        </td>
        <td>
          <div style="display:flex; gap:0.35rem;">
            <button class="btn btn-sm btn-outline" onclick="window.App.partyReminder('${p.id}')">Reminder</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Render Purchases Table
  function renderPurchasesTable() {
    const tbody = document.getElementById('purchasesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const purchases = appData.purchases || [];
    purchases.forEach(pur => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${pur.billNumber}</strong></td>
        <td>${pur.date}</td>
        <td>${pur.partyName}</td>
        <td>${formatINR(pur.totalAmount)}</td>
        <td><span class="badge badge-unpaid">${pur.status}</span></td>
        <td>${pur.paymentMode}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Render POS Screen
  function renderPOS() {
    const grid = document.getElementById('posItemGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const items = appData.items || [];
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'pos-item-card';
      card.innerHTML = `
        <div>
          <div style="font-weight:600; font-size:0.85rem; margin-bottom:4px;">${item.name}</div>
          <div class="text-muted" style="font-size:0.75rem;">${item.code}</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
          <span style="font-weight:700; color:var(--primary);">${formatINR(item.salePrice)}</span>
          <span class="badge badge-paid" style="font-size:0.65rem;">+ Add</span>
        </div>
      `;
      card.addEventListener('click', () => addToPOSCart(item));
      grid.appendChild(card);
    });

    renderPOSCart();
  }

  function addToPOSCart(item) {
    const existing = posCart.find(ci => ci.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      posCart.push({
        id: item.id,
        name: item.name,
        hsn: item.hsn,
        price: item.salePrice,
        taxRate: item.taxRate,
        qty: 1
      });
    }
    renderPOSCart();
  }

  function renderPOSCart() {
    const container = document.getElementById('posCartItems');
    if (!container) return;
    container.innerHTML = '';

    if (posCart.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted);">Cart is empty.<br>Click items on the left to add.</div>';
      document.getElementById('posSubtotal').textContent = '₹0.00';
      document.getElementById('posTax').textContent = '₹0.00';
      document.getElementById('posGrandTotal').textContent = '₹0.00';
      return;
    }

    let subtotal = 0;
    let totalTax = 0;

    posCart.forEach((ci, idx) => {
      const lineTotal = ci.price * ci.qty;
      const lineTax = (lineTotal * ci.taxRate) / 100;
      subtotal += lineTotal;
      totalTax += lineTax;

      const row = document.createElement('div');
      row.className = 'cart-item-row';
      row.innerHTML = `
        <div style="flex:1;">
          <div style="font-weight:600; font-size:0.85rem;">${ci.name}</div>
          <small class="text-muted">${formatINR(ci.price)} x ${ci.qty}</small>
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <button class="btn btn-sm btn-outline" style="padding:2px 8px;" onclick="window.App.changeCartQty(${idx}, -1)">-</button>
          <strong>${ci.qty}</strong>
          <button class="btn btn-sm btn-outline" style="padding:2px 8px;" onclick="window.App.changeCartQty(${idx}, 1)">+</button>
          <div style="min-width:60px; text-align:right; font-weight:600;">${formatINR(lineTotal)}</div>
        </div>
      `;
      container.appendChild(row);
    });

    const grandTotal = Math.round(subtotal + totalTax);
    document.getElementById('posSubtotal').textContent = formatINR(subtotal);
    document.getElementById('posTax').textContent = formatINR(totalTax);
    document.getElementById('posGrandTotal').textContent = formatINR(grandTotal);
  }

  // Render Subscription View
  function renderSubscription() {
    const container = document.getElementById('subscriptionPlansContainer');
    if (!container) return;
    container.innerHTML = '';

    const currentSub = appData.subscription || {};
    const plans = appData.plansCatalog || [];
    const isYearly = document.getElementById('pricingCycleToggle')?.checked;

    plans.forEach(plan => {
      const isCurrent = currentSub.planId === plan.id;
      const price = isYearly ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
      const card = document.createElement('div');
      card.className = `pricing-card ${plan.id === 'pro' ? 'featured' : ''}`;
      card.innerHTML = `
        ${plan.badge ? `<div class="plan-badge">${plan.badge}</div>` : ''}
        <div class="pricing-header">
          <h3>${plan.name}</h3>
          <p>${plan.tagline}</p>
        </div>
        <div class="pricing-price">
          <span class="amount">₹${price}</span>
          ${isYearly ? `<span class="strikethrough">₹${plan.monthlyPrice}</span>` : ''}
          <span class="period">/ month</span>
        </div>
        <ul class="pricing-features">
          ${plan.features.map(f => `
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>${f}</span>
            </li>
          `).join('')}
        </ul>
        <button class="btn ${isCurrent ? 'btn-outline' : 'btn-primary'}" onclick="window.App.openUpgradeModal('${plan.id}')">
          ${isCurrent ? '✓ Current Active Plan' : 'Upgrade to ' + plan.name}
        </button>
      `;
      container.appendChild(card);
    });
  }

  // Render Reports
  function renderReports() {
    const invoices = appData.invoices || [];
    let b2bTotal = 0;
    let b2bTax = 0;
    let b2cTotal = 0;
    let b2cTax = 0;

    invoices.forEach(inv => {
      if (inv.partyGstin && inv.partyGstin.length >= 10) {
        b2bTotal += inv.taxableTotal || 0;
        b2bTax += inv.totalTax || 0;
      } else {
        b2cTotal += inv.taxableTotal || 0;
        b2cTax += inv.totalTax || 0;
      }
    });

    document.getElementById('repB2bTaxable').textContent = formatINR(b2bTotal);
    document.getElementById('repB2bTax').textContent = formatINR(b2bTax);
    document.getElementById('repB2cTaxable').textContent = formatINR(b2cTotal);
    document.getElementById('repB2cTax').textContent = formatINR(b2cTax);
    document.getElementById('repTotalTax').textContent = formatINR(b2bTax + b2cTax);
  }

  // Render Settings
  function renderSettings() {
    const biz = appData.business || {};
    document.getElementById('setBizName').value = biz.name || '';
    document.getElementById('setGstin').value = biz.gstin || '';
    document.getElementById('setPhone').value = biz.phone || '';
    document.getElementById('setEmail').value = biz.email || '';
    document.getElementById('setAddress').value = biz.address || '';
    document.getElementById('setUpiId').value = biz.upiId || 'joy.john@ybl';
    document.getElementById('setBankName').value = biz.bankName || '';
    document.getElementById('setAccountNo').value = biz.accountNumber || '';
    document.getElementById('setIfsc').value = biz.ifscCode || '';
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Pricing cycle toggle
    const toggle = document.getElementById('pricingCycleToggle');
    if (toggle) {
      toggle.addEventListener('change', () => renderSubscription());
    }

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    // Force Cloud Push
    const pushBtn = document.getElementById('btnForceSync');
    if (pushBtn) {
      pushBtn.addEventListener('click', async () => {
        pushBtn.textContent = 'Syncing...';
        await window.CloudSync.pushToCloud();
        pushBtn.textContent = 'Sync Cloud';
      });
    }
  }

  // View & Render A4 Invoice Modal (Matching MyBillBook Template)
  function viewInvoice(invoiceId) {
    const inv = appData.invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    const biz = appData.business;
    const upiLink = `upi://pay?pa=${biz.upiId}&pn=${encodeURIComponent(biz.owner || biz.name)}&am=${inv.balanceDue || inv.grandTotal}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiLink)}`;

    const container = document.getElementById('invoicePrintPreview');
    container.innerHTML = `
      <div style="border: 2px solid #000; padding: 20px; font-family: Roboto, sans-serif; background: #fff; max-width: 800px; margin: 0 auto; color: #000;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; color: #1e3a8a; margin-bottom: 4px;">${biz.name}</h2>
            <div style="font-size: 11px; max-width: 420px; line-height: 1.4;">${biz.address}</div>
            <div style="font-size: 11px; margin-top: 4px;">
              <strong>GSTIN:</strong> ${biz.gstin} | <strong>PAN:</strong> ${biz.pan}
            </div>
            <div style="font-size: 11px;">
              <strong>Phone:</strong> ${biz.phone} | <strong>Email:</strong> ${biz.email}
            </div>
          </div>
          <div style="text-align: right; min-width: 200px;">
            <div style="display: inline-block; background: #f97316; color: #fff; padding: 4px 12px; font-weight: 700; font-size: 14px; border-radius: 4px; text-transform: uppercase;">
              TAX INVOICE
            </div>
            <div style="font-size: 12px; margin-top: 8px;"><strong>Invoice No:</strong> ${inv.invoiceNumber}</div>
            <div style="font-size: 12px;"><strong>Invoice Date:</strong> ${inv.date}</div>
            <div style="font-size: 12px;"><strong>Due Date:</strong> ${inv.dueDate}</div>
            <div style="font-size: 12px;"><strong>Place of Supply:</strong> ${inv.placeOfSupply}</div>
          </div>
        </div>

        <!-- Bill To -->
        <div style="border: 1px solid #000; padding: 8px 12px; margin-bottom: 12px; font-size: 11px; background: #fafafa;">
          <div style="font-weight: 700; font-size: 12px; margin-bottom: 2px; text-transform: uppercase;">Bill To (Customer Details):</div>
          <div style="font-size: 13px; font-weight: 700; color: #111;">${inv.partyName}</div>
          <div>${inv.partyAddress}</div>
          <div><strong>GSTIN:</strong> ${inv.partyGstin || 'Unregistered'} | <strong>Phone:</strong> ${inv.partyPhone}</div>
        </div>

        <!-- Item Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px;">
          <thead>
            <tr style="background: #e2e8f0; border-top: 1px solid #000; border-bottom: 1px solid #000;">
              <th style="padding: 6px; border-right: 1px solid #000; text-align: center; width: 30px;">#</th>
              <th style="padding: 6px; border-right: 1px solid #000; text-align: left;">Item Description</th>
              <th style="padding: 6px; border-right: 1px solid #000; text-align: center; width: 70px;">HSN/SAC</th>
              <th style="padding: 6px; border-right: 1px solid #000; text-align: right; width: 50px;">Qty</th>
              <th style="padding: 6px; border-right: 1px solid #000; text-align: right; width: 65px;">Rate</th>
              <th style="padding: 6px; border-right: 1px solid #000; text-align: right; width: 50px;">Disc</th>
              <th style="padding: 6px; border-right: 1px solid #000; text-align: right; width: 75px;">Taxable</th>
              <th style="padding: 6px; border-right: 1px solid #000; text-align: right; width: 70px;">GST</th>
              <th style="padding: 6px; text-align: right; width: 85px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${inv.items.map((it, idx) => `
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 6px; border-right: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
                <td style="padding: 6px; border-right: 1px solid #cbd5e1;"><strong>${it.name}</strong></td>
                <td style="padding: 6px; border-right: 1px solid #cbd5e1; text-align: center;">${it.hsn}</td>
                <td style="padding: 6px; border-right: 1px solid #cbd5e1; text-align: right;">${it.quantity} ${it.unit}</td>
                <td style="padding: 6px; border-right: 1px solid #cbd5e1; text-align: right;">${formatINR(it.rate)}</td>
                <td style="padding: 6px; border-right: 1px solid #cbd5e1; text-align: right;">${it.discountPercent}%</td>
                <td style="padding: 6px; border-right: 1px solid #cbd5e1; text-align: right;">${formatINR(it.taxableAmount)}</td>
                <td style="padding: 6px; border-right: 1px solid #cbd5e1; text-align: right;">${it.taxRate}%</td>
                <td style="padding: 6px; text-align: right; font-weight: 600;">${formatINR(it.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals & Payment Section -->
        <div style="display: flex; justify-content: space-between; border-top: 1px solid #000; padding-top: 10px; font-size: 11px;">
          <!-- Left: Bank & UPI QR -->
          <div style="flex: 1; margin-right: 20px;">
            <div style="font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">Bank Account Details:</div>
            <div><strong>Bank:</strong> ${biz.bankName}</div>
            <div><strong>A/c Number:</strong> ${biz.accountNumber}</div>
            <div><strong>IFSC Code:</strong> ${biz.ifscCode} (${biz.branch})</div>
            <div><strong>UPI ID:</strong> <span style="color: #2563eb; font-weight: 700;">${biz.upiId}</span></div>

            <div style="margin-top: 10px; display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 8px; border: 1px dashed #94a3b8; border-radius: 6px;">
              <img src="${qrUrl}" alt="UPI QR" style="width: 80px; height: 80px; border: 1px solid #cbd5e1; border-radius: 4px;" />
              <div>
                <div style="font-weight: 700; color: #1e293b;">Scan to Pay via UPI</div>
                <div style="font-size: 10px; color: #64748b;">Paytm, PhonePe, GPay, BHIM</div>
                <div style="font-weight: 700; color: #f97316; font-size: 12px; margin-top: 2px;">${formatINR(inv.balanceDue || inv.grandTotal)}</div>
              </div>
            </div>

            <div style="margin-top: 8px; font-size: 10px; color: #475569;">
              <strong>Terms:</strong><br>${biz.terms.replace(/\n/g, '<br>')}
            </div>
          </div>

          <!-- Right: Tax & Grand Total -->
          <div style="width: 280px;">
            <div style="display: flex; justify-content: space-between; padding: 3px 0;">
              <span>Subtotal:</span>
              <strong>${formatINR(inv.subtotal)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 3px 0;">
              <span>Discount:</span>
              <span>-${formatINR(inv.totalDiscount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 3px 0;">
              <span>CGST:</span>
              <span>${formatINR(inv.cgstTotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 3px 0;">
              <span>SGST:</span>
              <span>${formatINR(inv.sgstTotal)}</span>
            </div>
            ${inv.igstTotal > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 3px 0;">
                <span>IGST:</span>
                <span>${formatINR(inv.igstTotal)}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid #cbd5e1;">
              <span>Round Off:</span>
              <span>${inv.roundOff >= 0 ? '+' : ''}${inv.roundOff}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; font-size: 14px; font-weight: 800; color: #1e3a8a;">
              <span>Grand Total:</span>
              <span>${formatINR(inv.grandTotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: var(--success); font-weight: 600;">
              <span>Amount Paid:</span>
              <span>${formatINR(inv.amountPaid)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: var(--danger); font-weight: 700; font-size: 12px;">
              <span>Balance Due:</span>
              <span>${formatINR(inv.balanceDue)}</span>
            </div>

            <!-- Signatory -->
            <div style="margin-top: 25px; text-align: center; border-top: 1px dashed #94a3b8; padding-top: 6px;">
              <div style="font-size: 11px; font-weight: 700;">For ${biz.name}</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 20px;">Authorized Signatory</div>
            </div>
          </div>
        </div>

        <!-- Words -->
        <div style="border-top: 1px solid #cbd5e1; margin-top: 10px; padding-top: 6px; font-size: 10px; color: #334155;">
          <strong>Total in Words:</strong> ${numberToWordsINR(inv.grandTotal)}
        </div>
      </div>
    `;

    document.getElementById('invoiceViewModal').classList.add('active');
  }

  // POS Checkout & Print Thermal Slip
  function checkoutPOS(paymentMethod) {
    if (posCart.length === 0) {
      alert('POS cart is empty!');
      return;
    }

    const biz = appData.business;
    let subtotal = 0;
    let totalTax = 0;
    const invItems = posCart.map(ci => {
      const lineTotal = ci.price * ci.qty;
      const lineTax = (lineTotal * ci.taxRate) / 100;
      subtotal += lineTotal;
      totalTax += lineTax;
      return {
        itemId: ci.id,
        name: ci.name,
        hsn: ci.hsn,
        quantity: ci.qty,
        unit: 'PCS',
        rate: ci.price,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: lineTotal,
        taxRate: ci.taxRate,
        cgst: lineTax / 2,
        sgst: lineTax / 2,
        igst: 0,
        total: lineTotal + lineTax
      };
    });

    const grandTotal = Math.round(subtotal + totalTax);
    const invNumber = `BILL-${biz.nextInvoiceNumber++}`;
    const newInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: invNumber,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      partyId: 'pty_walkin',
      partyName: 'Walk-in Retail Customer',
      partyGstin: '',
      partyPhone: '+91 99999 00000',
      partyAddress: 'Retail POS Counter',
      placeOfSupply: biz.state + ' (' + biz.stateCode + ')',
      paymentMode: paymentMethod,
      status: 'Paid',
      items: invItems,
      subtotal: subtotal,
      totalDiscount: 0,
      taxableTotal: subtotal,
      cgstTotal: totalTax / 2,
      sgstTotal: totalTax / 2,
      igstTotal: 0,
      totalTax: totalTax,
      roundOff: 0,
      grandTotal: grandTotal,
      amountPaid: grandTotal,
      balanceDue: 0
    };

    // Deduct stock
    posCart.forEach(ci => {
      const it = appData.items.find(i => i.id === ci.id);
      if (it) it.stock = Math.max(0, it.stock - ci.qty);
    });

    appData.invoices.unshift(newInvoice);
    window.CloudSync.commit(appData);

    // Print Thermal Slip
    printThermalReceipt(newInvoice);

    // Reset POS Cart
    posCart = [];
    renderPOSCart();
    renderItemsTable();
    renderInvoicesTable();
    renderDashboard();
  }

  function printThermalReceipt(inv) {
    const biz = appData.business;
    const upiLink = `upi://pay?pa=${biz.upiId}&pn=${encodeURIComponent(biz.owner)}&am=${inv.grandTotal}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(upiLink)}`;

    const win = window.open('', '_blank', 'width=350,height=600');
    win.document.write(`
      <html>
        <head>
          <title>POS Receipt - ${inv.invoiceNumber}</title>
          <style>
            body { font-family: monospace; font-size: 11px; width: 280px; margin: 0 auto; padding: 10px; color: #000; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { padding: 3px 0; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <strong>${biz.name}</strong><br>
            ${biz.address}<br>
            GSTIN: ${biz.gstin}<br>
            Phone: ${biz.phone}
          </div>
          <div class="divider"></div>
          <div>
            Bill No: ${inv.invoiceNumber}<br>
            Date: ${inv.date} | Mode: ${inv.paymentMode}<br>
            Customer: Walk-in Retail
          </div>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th style="text-align:left;">Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amt</th>
              </tr>
            </thead>
            <tbody>
              ${inv.items.map(it => `
                <tr>
                  <td>${it.name.substring(0, 16)}</td>
                  <td class="text-right">${it.quantity}</td>
                  <td class="text-right">${it.rate}</td>
                  <td class="text-right">${it.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div style="font-size:12px; font-weight:bold; display:flex; justify-content:space-between;">
            <span>GRAND TOTAL:</span>
            <span>₹${inv.grandTotal}</span>
          </div>
          <div style="font-size:10px; display:flex; justify-content:space-between; margin-top:2px;">
            <span>Paid by ${inv.paymentMode}:</span>
            <span>₹${inv.amountPaid}</span>
          </div>
          <div class="divider"></div>
          <div class="text-center" style="margin-top:6px;">
            <img src="${qrUrl}" width="90" height="90" /><br>
            <small>Scan to Pay with UPI (${biz.upiId})</small><br><br>
            *** THANK YOU FOR VISITING ***
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  }

  // Open Upgrade Plan Modal
  function openUpgradeModal(planId) {
    const plan = appData.plansCatalog.find(p => p.id === planId);
    if (!plan) return;

    const isYearly = document.getElementById('pricingCycleToggle')?.checked;
    const price = isYearly ? plan.yearlyMonthlyPrice * 12 : plan.monthlyPrice;
    const upiLink = `upi://pay?pa=joy.john@ybl&pn=Joy%20John&am=${price}&cu=INR&tn=BillBook%20${encodeURIComponent(plan.name)}%20Subscription`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`;

    const body = document.getElementById('upgradeModalBody');
    body.innerHTML = `
      <div style="text-align:center;">
        <h3 style="font-size:1.3rem; font-weight:700; color:var(--primary); margin-bottom:4px;">Upgrade to ${plan.name} Plan</h3>
        <p class="text-muted" style="font-size:0.85rem; margin-bottom:1.5rem;">${plan.tagline}</p>
        
        <div style="background:#f8fafc; border:1px solid var(--border); border-radius:10px; padding:1.25rem; display:inline-block; margin-bottom:1.5rem;">
          <div style="font-size:0.8rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); margin-bottom:4px;">Payable Amount</div>
          <div style="font-size:2rem; font-weight:800; color:var(--text-main); margin-bottom:4px;">₹${price}</div>
          <div style="font-size:0.75rem; color:#64748b;">${isYearly ? 'Annual Commitment (20% Discount Applied)' : 'Monthly Billing'}</div>
          
          <div style="margin:1rem auto 0.5rem; width:150px;">
            <img src="${qrUrl}" alt="UPI QR" style="width:150px; height:150px; border-radius:6px; border:1px solid #cbd5e1;" />
          </div>
          <div style="font-weight:700; color:#2563eb; font-size:0.9rem;">joy.john@ybl</div>
          <div style="font-size:0.75rem; color:#64748b;">(Joy John - Official UPI Gateway)</div>
        </div>

        <div>
          <button class="btn btn-primary" style="width:100%; max-width:320px; margin:0 auto;" onclick="window.App.activatePlan('${plan.id}')">
            I Have Paid - Activate ${plan.name} Now
          </button>
        </div>
      </div>
    `;

    document.getElementById('upgradeModal').classList.add('active');
  }

  function activatePlan(planId) {
    const plan = appData.plansCatalog.find(p => p.id === planId);
    if (!plan) return;

    appData.subscription = {
      planId: plan.id,
      planName: `${plan.name} Plan`,
      tier: plan.id.toUpperCase(),
      pricePerMonth: plan.yearlyMonthlyPrice,
      billingCycle: 'Yearly',
      status: 'Active',
      startedOn: new Date().toISOString().split('T')[0],
      expiresOn: '2027-12-31',
      daysRemaining: 365,
      limits: plan.limits,
      features: {
        gstInvoicing: true,
        posCounter: true,
        thermalPrinting: true,
        customThemes: true,
        onlineStore: true,
        barcodeGenerator: true,
        barcodeScanner: true,
        whatsappReminders: true,
        eWayBill: true,
        eInvoicing: true,
        tallyExport: true,
        rolePermissions: true,
        multiGodowns: true,
        gstrReports: true,
        cloudSync: true
      }
    };

    window.CloudSync.commit(appData);
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    renderHeaderInfo();
    renderSubscription();
    alert(`Congratulations! Your subscription has been successfully upgraded to ${plan.name} Plan.`);
  }

  // Stock Adjustment
  function adjustStock(itemId) {
    const it = appData.items.find(i => i.id === itemId);
    if (!it) return;
    const addQty = prompt(`Adjust Stock for "${it.name}"\nCurrent Stock: ${it.stock} ${it.unit}\nEnter quantity to add (use negative to reduce):`, "10");
    if (addQty !== null) {
      const val = parseInt(addQty, 10);
      if (!isNaN(val)) {
        it.stock = Math.max(0, it.stock + val);
        window.CloudSync.commit(appData);
        renderItemsTable();
        renderDashboard();
      }
    }
  }

  // Party WhatsApp Reminder
  function partyReminder(partyId) {
    const p = appData.parties.find(x => x.id === partyId);
    if (!p) return;
    const msg = `Dear ${p.contactPerson}, Greetings from ${appData.business.name}. This is a gentle reminder regarding your outstanding balance of ${formatINR(p.currentBalance)}. You may easily pay via UPI to ${appData.business.upiId}. Thank you for your continued business!`;
    const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  // Save Settings
  function saveSettings() {
    const biz = appData.business;
    biz.name = document.getElementById('setBizName').value;
    biz.gstin = document.getElementById('setGstin').value;
    biz.phone = document.getElementById('setPhone').value;
    biz.email = document.getElementById('setEmail').value;
    biz.address = document.getElementById('setAddress').value;
    biz.upiId = document.getElementById('setUpiId').value;
    biz.bankName = document.getElementById('setBankName').value;
    biz.accountNumber = document.getElementById('setAccountNo').value;
    biz.ifscCode = document.getElementById('setIfsc').value;

    window.CloudSync.commit(appData);
    renderHeaderInfo();
    alert('Business profile updated successfully!');
  }

  // Expose Global App API
  window.App = {
    init: initApp,
    switchTab: switchTab,
    viewInvoice: viewInvoice,
    changeCartQty: (idx, delta) => {
      if (posCart[idx]) {
        posCart[idx].qty += delta;
        if (posCart[idx].qty <= 0) posCart.splice(idx, 1);
        renderPOSCart();
      }
    },
    checkoutPOS: checkoutPOS,
    openUpgradeModal: openUpgradeModal,
    activatePlan: activatePlan,
    adjustStock: adjustStock,
    partyReminder: partyReminder,
    saveSettings: saveSettings,
    shareWhatsApp: (invoiceId) => {
      const inv = appData.invoices.find(i => i.id === invoiceId);
      if (!inv) return;
      const msg = `Dear ${inv.partyName}, here is your Tax Invoice ${inv.invoiceNumber} for ${formatINR(inv.grandTotal)} from ${appData.business.name}. Balance Due: ${formatINR(inv.balanceDue)}. Pay instantly via UPI: ${appData.business.upiId}.`;
      const cleanPhone = (inv.partyPhone || '').replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', initApp);
})();
