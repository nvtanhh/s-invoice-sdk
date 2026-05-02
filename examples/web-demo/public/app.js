// --- State (sessionStorage-backed) ---
const state = {
  creds: JSON.parse(sessionStorage.getItem('vinvoice.creds') || 'null'),
}

function setCreds(c) {
  state.creds = c
  sessionStorage.setItem('vinvoice.creds', JSON.stringify(c))
  renderStatus()
}

function renderStatus() {
  const pill = document.getElementById('status-pill')
  if (state.creds?.taxCode) {
    pill.textContent = `Connected as ${state.creds.taxCode}`
    pill.className = 'pill pill-connected'
  } else {
    pill.textContent = 'Not connected'
    pill.className = 'pill pill-disconnected'
  }
}

// --- Tab switcher ---
function showTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
  document.querySelectorAll('[data-panel]').forEach(s => {
    if (s.tagName === 'SECTION') s.hidden = s.dataset.panel !== tab
  })
  sessionStorage.setItem('vinvoice.activeTab', tab)
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab))
})

// --- JSON syntax highlight (~30 lines, regex-based) ---
function highlight(json) {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      match => {
        if (/^"/.test(match)) {
          return /:$/.test(match)
            ? `<span class="json-key">${match}</span>`
            : `<span class="json-string">${match}</span>`
        }
        if (/true|false/.test(match)) return `<span class="json-boolean">${match}</span>`
        if (/null/.test(match)) return `<span class="json-null">${match}</span>`
        return `<span class="json-number">${match}</span>`
      }
    )
}

function renderJson(panel, role, obj) {
  const pre = document.querySelector(`pre[data-panel="${panel}"][data-role="${role}"]`)
  if (pre) pre.innerHTML = highlight(JSON.stringify(obj, null, 2))
}

function renderError(panel, err) {
  // Append an error block below the response pre
  const container = document.querySelector(`pre[data-panel="${panel}"][data-role="response"]`).parentElement
  let block = container.querySelector('.error-block')
  if (!block) { block = document.createElement('div'); block.className = 'error-block'; container.appendChild(block) }
  const issuesList = err.issues?.length
    ? `<ul class="issues">${err.issues.map(i => `<li><b>${i.path}</b>: ${i.message}</li>`).join('')}</ul>`
    : ''
  block.innerHTML = `<strong>${err.name}: ${err.message}</strong>
    ${err.errorCode ? `<div>Error code: ${err.errorCode}</div>` : ''}
    ${err.httpStatus ? `<div>HTTP status: ${err.httpStatus}</div>` : ''}
    ${issuesList}`
}

function clearError(panel) {
  document.querySelectorAll(`[data-panel="${panel}"] .error-block, [data-panel="${panel}"] .success-block`)
    .forEach(el => el.remove())
}

function renderSuccess(panel, msg) {
  const container = document.querySelector(`pre[data-panel="${panel}"][data-role="response"]`).parentElement
  let block = container.querySelector('.success-block')
  if (!block) { block = document.createElement('div'); block.className = 'success-block'; container.appendChild(block) }
  block.innerHTML = `<strong>${msg}</strong>`
}

// --- Credential masking ---
function redactCreds(creds) {
  return { ...creds, password: creds.password ? '***' : creds.password }
}

// --- Fetch helper ---
async function callApi(panel, path, payload) {
  clearError(panel)
  if (!state.creds) { alert('Connect first'); return }
  const body = { creds: state.creds, payload }
  renderJson(panel, 'request', { creds: redactCreds(state.creds), payload })
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  const json = await res.json()
  renderJson(panel, 'response', json)
  if (!json.ok) renderError(panel, json.error)
}

// --- Form: Connect ---
document.querySelector('[data-form="connect"]').addEventListener('submit', async e => {
  e.preventDefault()
  clearError('connect')
  const fd = new FormData(e.target)
  const creds = {
    baseUrl: fd.get('baseUrl').trim(),
    username: fd.get('username').trim(),
    password: fd.get('password'),
    taxCode: fd.get('taxCode').trim()
  }
  renderJson('connect', 'request', { creds: redactCreds(creds) })
  const res = await fetch('/api/connect', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ creds })
  })
  const json = await res.json()
  renderJson('connect', 'response', json)
  if (json.ok) {
    setCreds(creds)
    renderSuccess('connect', json.response.message)
  } else {
    renderError('connect', json.error)
  }
})

// --- Form: Create Invoice ---
document.querySelector('[data-form="create"]').addEventListener('submit', async e => {
  e.preventDefault()
  const fd = new FormData(e.target)
  const unitPrice = Number(fd.get('unitPrice'))
  const quantity = Number(fd.get('quantity'))
  const taxPercentage = Number(fd.get('taxPercentage'))
  const itemTotalAmountWithoutTax = unitPrice * quantity
  const taxAmount = Math.round(itemTotalAmountWithoutTax * taxPercentage / 100)
  const totalAmountWithoutTax = itemTotalAmountWithoutTax
  const totalAmountWithTax = itemTotalAmountWithoutTax + taxAmount
  const buyerTaxCode = fd.get('buyerTaxCode').trim()

  const payload = {
    generalInvoiceInfo: {
      invoiceType: '1',
      templateCode: fd.get('templateCode').trim(),
      invoiceSeries: fd.get('invoiceSeries').trim(),
      currencyCode: fd.get('currencyCode').trim() || 'VND',
      adjustmentType: '1'
    },
    buyerInfo: {
      buyerName: fd.get('buyerName').trim(),
      buyerLegalName: fd.get('buyerLegalName').trim(),
      ...(buyerTaxCode ? { buyerTaxCode } : {})
    },
    itemInfo: [{
      lineNumber: 1,
      itemName: fd.get('itemName').trim(),
      unitName: fd.get('unitName').trim(),
      unitPrice,
      quantity,
      itemTotalAmountWithoutTax,
      taxPercentage,
      taxAmount
    }],
    summarizeInfo: { totalAmountWithoutTax, totalAmountWithTax },
    payments: [{ paymentMethodName: fd.get('paymentMethodName').trim() }]
  }
  await callApi('create', '/api/invoices/create', payload)
})

// --- Form: Search ---
document.querySelector('[data-form="search"]').addEventListener('submit', async e => {
  e.preventDefault()
  const fd = new FormData(e.target)
  const payload = {
    supplierTaxCode: state.creds?.taxCode ?? '',
    transactionUuid: fd.get('transactionUuid').trim()
  }
  await callApi('search', '/api/invoices/search', payload)
})

// --- Form: Cancel ---
document.querySelector('[data-form="cancel"]').addEventListener('submit', async e => {
  e.preventDefault()
  const fd = new FormData(e.target)
  const reasonDelete = fd.get('reasonDelete').trim()
  const payload = {
    supplierTaxCode: state.creds?.taxCode ?? '',
    templateCode: fd.get('templateCode').trim(),
    invoiceNo: fd.get('invoiceNo').trim(),
    strIssueDate: new Date(fd.get('issueDate')).getTime(),
    additionalReferenceDesc: fd.get('additionalReferenceDesc').trim(),
    additionalReferenceDate: new Date(fd.get('additionalReferenceDate')).getTime(),
    ...(reasonDelete ? { reasonDelete } : {})
  }
  await callApi('cancel', '/api/invoices/cancel', payload)
})

// --- Form: List Invoices ---
document.querySelector('[data-form="list"]').addEventListener('submit', async e => {
  e.preventDefault()
  const fd = new FormData(e.target)
  const toDateStr = fd.get('toDate')
  const fromDateStr = fd.get('fromDate')
  // Convert yyyy-mm-dd (HTML date input) → dd/MM/yyyy (API format)
  const toDmy = s => s.split('-').reverse().join('/')
  const payload = {
    supplierTaxCode: state.creds?.taxCode ?? '',
    fromDate: toDmy(fromDateStr),
    toDate: toDmy(toDateStr),
    rowPerPage: Number(fd.get('rowPerPage')) || 20,
    pageNum: Number(fd.get('pageNum')) || 0,
  }
  const invoiceType = fd.get('invoiceType')
  if (invoiceType) payload.invoiceType = invoiceType
  const status = fd.get('status').trim()
  if (status !== '') payload.status = Number(status)
  await callApi('list', '/api/invoices/list', payload)
})

// --- Bootstrap on load ---
document.addEventListener('DOMContentLoaded', async () => {
  renderStatus()

  // Pre-fill connect form from sessionStorage creds
  if (state.creds) {
    const form = document.querySelector('[data-form="connect"]')
    if (form) {
      form.baseUrl.value = state.creds.baseUrl ?? ''
      form.username.value = state.creds.username ?? ''
      form.taxCode.value = state.creds.taxCode ?? ''
    }
  }

  // Pre-fill Create form with GTGT defaults
  try {
    const res = await fetch('/api/defaults/gtgt')
    if (res.ok) {
      const defaults = await res.json()
      const form = document.querySelector('[data-form="create"]')
      if (form) {
        if (defaults.templateCode) form.templateCode.value = defaults.templateCode
        if (defaults.invoiceSeries) form.invoiceSeries.value = defaults.invoiceSeries
        if (defaults.currencyCode) form.currencyCode.value = defaults.currencyCode
      }
    }
  } catch (_) { /* server not ready yet */ }

  // Restore last active tab
  const lastTab = sessionStorage.getItem('vinvoice.activeTab')
  if (lastTab) showTab(lastTab)
  else if (!state.creds) showTab('connect')
})
