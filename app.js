let currentUser = JSON.parse(localStorage.getItem('giti_export_user')) || null;
let inventory = [
    { id: 1, name: 'جاكيت شتوي تصدير فاخر', category: 'تصدير دولي', price: 650, qty: 150, type: 'image', mediaUrl: 'https://via.placeholder.com/150/0f172a/00a4ef?text=Jacket' },
    { id: 2, name: 'طقم بنطلون وتيشرت جملة', category: 'جملة محلي', price: 300, qty: 80, type: 'image', mediaUrl: 'https://via.placeholder.com/150/1e293b/00a4ef?text=Set' },
    { id: 3, name: 'أقمشة قطنية فاخرة للبيع بالجملة', category: 'أقمشة ومنسوجات', price: 1200, qty: 200, type: 'image', mediaUrl: 'https://via.placeholder.com/150/111827/00a4ef?text=Fabrics' }
];
let orders = [];
let invoicesArchive = [];
let chatLogs = [
    { sender: 'إدارة المنصة', role: 'مدير', avatar: '', text: 'أهلاً بك في دعم Giti Export B2B السحابي.' }
];
let notifications = [
    { id: 1, text: '🎉 أهلاً بك في منصة Giti Export للتجارة المحلية والدولية السحابية!', date: 'اليوم' }
];
let rfqs = [];

let currentCart = [];
let currentFilter = 'all';
let currentCartFilter = 'all';
let tempNewProdMedia = null;
let tempNewProdMediaType = 'image';
let activeInvoice = null;

window.initPlatformAfterLogin = function() {
    initCloudListeners();
    renderStore();
    renderWarehouseManagement();
    renderOrders();
    renderInvoicesArchive();
    renderChat();
    renderFinancialReports();
    renderNotifications();
    updateStats();
    renderCart();
};

window.onload = function() {
    if(currentUser) {
        window.initPlatformAfterLogin();
    }
};

// الاستماع للبيانات السحابية الحية عبر Firestore
function initCloudListeners() {
    if(!window.db || !window.firebaseFns) return;
    const { collection, onSnapshot } = window.firebaseFns;

    onSnapshot(collection(window.db, "inventory"), (snapshot) => {
        if(!snapshot.empty) {
            inventory = [];
            snapshot.forEach((doc) => {
                inventory.push({ id: doc.id, ...doc.data() });
            });
            renderStore();
            renderWarehouseManagement();
            updateStats();
        }
    }, (error) => { console.error("Inventory sync error:", error); });

    onSnapshot(collection(window.db, "orders"), (snapshot) => {
        if(!snapshot.empty) {
            orders = [];
            invoicesArchive = [];
            snapshot.forEach((doc) => {
                let ord = { id: doc.id, ...doc.data() };
                orders.push(ord);
                invoicesArchive.push(ord);
            });
            renderOrders();
            renderInvoicesArchive();
            renderFinancialReports();
            updateStats();
        }
    }, (error) => { console.error("Orders sync error:", error); });

    onSnapshot(collection(window.db, "chats"), (snapshot) => {
        if(!snapshot.empty) {
            chatLogs = [];
            snapshot.forEach((doc) => {
                chatLogs.push(doc.data());
            });
            renderChat();
        }
    }, (error) => { console.error("Chats sync error:", error); });
}

// دالة عامة لرفع وحفظ البيانات سحابياً في Firestore
async function syncDataToCloud(collectionName, dataObj, docId = null) {
    if(!window.db || !window.firebaseFns) return;
    try {
        const { collection, addDoc, setDoc, doc } = window.firebaseFns;
        if(docId) {
            await setDoc(doc(window.db, collectionName, String(docId)), dataObj);
        } else {
            await addDoc(collection(window.db, collectionName), dataObj);
        }
    } catch(e) {
        console.error("Cloud sync error: ", e);
    }
}

window.toggleSidebar = function() {
    document.getElementById('sideDrawer').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

window.toggleGPlusDrawer = function() {
    if(!currentUser) {
        alert('⚠️ يرجى تسجيل الدخول أولاً!');
        window.switchTab('authSection');
        return;
    }
    document.getElementById('gplusProfileDrawer').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

window.closeAllDrawers = function() {
    document.getElementById('sideDrawer').classList.remove('open');
    document.getElementById('gplusProfileDrawer').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

window.checkProfileDrawerAccess = function() {
    if (!currentUser) {
        alert('⚠️ يرجى تسجيل الدخول أولاً للتمتع بالحساب!');
        window.switchTab('authSection');
    } else {
        window.toggleGPlusDrawer();
    }
}

window.openLightbox = function(url, type) {
    let lightbox = document.getElementById('mediaLightbox');
    let container = document.getElementById('lightboxContainer');
    if(type === 'video') {
        container.innerHTML = `<video src="${url}" class="media-lightbox-content" controls autoplay></video>`;
    } else {
        container.innerHTML = `<img src="${url}" class="media-lightbox-content" alt="Media">`;
    }
    lightbox.classList.add('active');
}

window.closeLightbox = function() {
    document.getElementById('mediaLightbox').classList.remove('active');
    document.getElementById('lightboxContainer').innerHTML = '';
}

window.setTheme = function(primary, accent, bg, card) {
    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--bg-color', bg);
    document.documentElement.style.setProperty('--card-bg', card);
}

window.switchTab = function(tabId, btnElement = null) {
    if(!currentUser && tabId !== 'authSection') {
        alert('⚠️ لا يمكن استعراض الأقسام إلا بعد تسجيل الدخول السحابي!');
        window.switchTab('authSection');
        return;
    }

    ['storeTab', 'addProductTab', 'advancedInvoicesStoreTab', 'exportTab', 'logisticsTab', 'invoicesViewerTab', 'ordersTab', 'financialReportsTab', 'notificationsTab', 'rfqTab', 'b2bVerifyTab', 'shippingDocsTab', 'supportTab', 'adminDashboardTab', 'authSection', 'invoiceModal'].forEach(id => {
        let el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    let target = document.getElementById(tabId);
    if(target) target.classList.remove('hidden');
    if(btnElement) {
        document.querySelectorAll('.nav-bar button').forEach(b => b.classList.remove('active-nav'));
        btnElement.classList.add('active-nav');
    }
    window.closeAllDrawers();
}

window.updateAuthUI = function() {
    let btnTop = document.getElementById('authBtnTop');
    let greet = document.getElementById('quickUserGreet');
    let topAvatar = document.getElementById('topNavAvatar');
    let mainNavBar = document.getElementById('mainNavBar');
    let menuToggleBtn = document.getElementById('menuToggleBtn');
    let profileBtnTop = document.getElementById('profileBtnTop');
    let notifTopBtn = document.getElementById('notifTopBtn');
    
    currentUser = JSON.parse(localStorage.getItem('giti_export_user')) || window.currentUser;

    if(currentUser) {
        btnTop.innerText = 'خروج'; 
        btnTop.className = 'btn-red';
        greet.innerText = currentUser.name;
        
        if(currentUser.avatar) {
            topAvatar.src = currentUser.avatar;
            let gpAv = document.getElementById('gpAvatarImg');
            if(gpAv) gpAv.src = currentUser.avatar;
        }
        topAvatar.style.display = 'block';
        mainNavBar.classList.remove('hidden');
        menuToggleBtn.style.display = 'inline-block';
        profileBtnTop.style.display = 'inline-block';
        notifTopBtn.style.display = 'inline-block';

        let gpName = document.getElementById('gpNameDisplay');
        let gpContact = document.getElementById('gpContactDisplay');
        let gpRole = document.getElementById('gpRoleBadge');
        if(gpName) gpName.innerText = currentUser.name;
        if(gpContact) gpContact.innerText = 'البريد: ' + currentUser.phone;
        if(gpRole) gpRole.innerText = currentUser.role === 'مدير' ? 'مدير المنصة Master Admin 🔐' : 'شركة معتمدة B2B 🏢';

        if(currentUser.cover) {
            let gpCover = document.getElementById('gpCoverImg');
            if(gpCover) gpCover.src = currentUser.cover;
        }

        window.initPlatformAfterLogin();
    } else {
        btnTop.innerText = 'تسجيل الدخول'; 
        btnTop.className = 'btn-gold';
        greet.innerText = 'يرجى تسجيل الدخول للتمتع بالخدمات';
        topAvatar.style.display = 'none';
        mainNavBar.classList.add('hidden');
        menuToggleBtn.style.display = 'none';
        profileBtnTop.style.display = 'none';
        notifTopBtn.style.display = 'none';
        window.switchTab('authSection');
    }
};

window.handleAvatarUpload = function(event) {
    let file = event.target.files[0];
    if(!file || !currentUser) return;
    let reader = new FileReader();
    reader.onload = function(e) {
        currentUser.avatar = e.target.result;
        localStorage.setItem('giti_export_user', JSON.stringify(currentUser));
        window.updateAuthUI();
        alert('✅ تم تحديث الصورة الشخصية بنجاح!');
    };
    reader.readAsDataURL(file);
}

window.handleCoverUpload = function(event) {
    let file = event.target.files[0];
    if(!file || !currentUser) return;
    let reader = new FileReader();
    reader.onload = function(e) {
        currentUser.cover = e.target.result;
        localStorage.setItem('giti_export_user', JSON.stringify(currentUser));
        window.updateAuthUI();
        alert('✅ تم تحديث الغلاف بنجاح!');
    };
    reader.readAsDataURL(file);
}

window.previewNewProductMedia = function(event) {
    let file = event.target.files[0];
    if(!file) return;
    let reader = new FileReader();
    tempNewProdMediaType = file.type.startsWith('video') ? 'video' : 'image';
    reader.onload = function(e) {
        tempNewProdMedia = e.target.result;
        let previewBox = document.getElementById('newProdMediaPreview');
        if(tempNewProdMediaType === 'video') {
            previewBox.innerHTML = `<video src="${tempNewProdMedia}" controls style="max-height:120px; border-radius:8px; border:1px solid var(--accent);"></video>`;
        } else {
            previewBox.innerHTML = `<img src="${tempNewProdMedia}" style="max-height:120px; border-radius:8px; border:1px solid var(--accent);">`;
        }
    };
    reader.readAsDataURL(file);
}

window.saveNewProductToStore = async function() {
    let name = document.getElementById('newProdName').value.trim();
    let price = parseFloat(document.getElementById('newProdPrice').value) || 0;
    let qty = parseInt(document.getElementById('newProdQty').value) || 1;
    let category = document.getElementById('newProdCategory').value;

    if(!name || !price) return alert('الرجاء إدخال اسم المنتج والسعر على الأقل!');
    if(!tempNewProdMedia) {
        tempNewProdMedia = 'https://via.placeholder.com/150/0f172a/00a4ef?text=Product';
    }

    let prodId = 'PROD-' + Date.now();
    let newProduct = {
        name, price, qty, category,
        type: tempNewProdMediaType,
        mediaUrl: tempNewProdMedia,
        addedBy: currentUser ? currentUser.name : 'إدارة النظام'
    };

    await syncDataToCloud("inventory", newProduct, prodId);
    window.addNotification(`📦 تمت إضافة منتج جديد: ${name} (${price} ج.م)`);

    document.getElementById('newProdName').value = '';
    document.getElementById('newProdPrice').value = '';
    document.getElementById('newProdMediaInput').value = '';
    document.getElementById('newProdMediaPreview').innerHTML = '';
    tempNewProdMedia = null;

    alert('✅ تمت إضافة المنتج ونشره سحابياً في المتجر بنجاح!');
    window.switchTab('storeTab');
}

window.filterCategory = function(cat, element) {
    currentFilter = cat;
    document.querySelectorAll('#storeTab .categories-grid .cat-chip').forEach(c => c.classList.remove('active'));
    element.classList.add('active');
    renderStore();
}

window.filterCartCategory = function(cat, element) {
    currentCartFilter = cat;
    let container = document.getElementById('cartCardSection');
    container.querySelectorAll('.categories-grid .cat-chip').forEach(c => c.classList.remove('active'));
    element.classList.add('active');
    renderCart();
}

function renderStore() {
    let container = document.getElementById('storeProductsList');
    if(!container || !currentUser) return;
    container.innerHTML = '';
    let filtered = inventory.filter(item => currentFilter === 'all' || item.category === currentFilter);
    if(filtered.length === 0) { container.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--text-muted);">لا توجد منتجات متاحة في هذا القسم.</p>'; return; }
    
    filtered.forEach(item => {
        let mediaElement = item.type === 'video' ? 
            `<video src="${item.mediaUrl}" onclick="event.stopPropagation(); openLightbox('${item.mediaUrl}', 'video')" muted></video>` :
            `<img src="${item.mediaUrl}" alt="${item.name}" onclick="event.stopPropagation(); openLightbox('${item.mediaUrl}', 'image')" title="انقر لتكبير الصورة">`;

        container.innerHTML += `
            <div class="product-card">
                <div>
                    ${mediaElement}
                    <b style="font-size: 13px; display:block; margin: 5px 0;">${item.name}</b>
                    <small style="color:var(--accent); font-weight:bold;">السعر: ${item.price} ج.م</small><br>
                    <small style="display:block; color:var(--text-muted);">المتوفر: ${item.qty}</small>
                </div>
                <div style="display:flex; flex-direction:column; gap:4px; margin-top:5px;">
                    <button class="btn-blue" style="padding: 5px; font-size: 11px; margin:0;" onclick="addToCart('${item.id}')">أضف للسلة 🛒</button>
                    <button class="btn-gold" style="padding: 4px; font-size: 10px; margin:0;" onclick="shareProduct('${item.name}', ${item.price})"><i class="fa-solid fa-share-nodes"></i> مشاركة 🌐</button>
                </div>
            </div>
        `;
    });
}

window.shareProduct = function(name, price) {
    let shareText = `🚢 منصة Giti Export\n📦 منتج: ${name}\n💰 السعر: ${price} جنيه`;
    if (navigator.share) {
        navigator.share({ title: name, text: shareText, url: window.location.href }).catch(() => {});
    } else {
        navigator.clipboard.writeText(shareText);
        alert('✅ تم نسخ تفاصيل المنتج بنجاح!');
    }
}

window.addToCart = function(id) {
    if(!currentUser) return alert('⚠️ يرجى تسجيل الدخول أولاً لإضافة منتجات إلى سلتك!');
    let item = inventory.find(i => i.id == id);
    if(!item) return alert('عذراً، المنتج غير متوفر!');
    
    currentCart.push(item);
    renderCart();
    alert('✅ تمت إضافة المنتج إلى سلتك الخاصة بنجاح!');
}

function renderCart() {
    let container = document.getElementById('cartItems');
    let total = 0;
    if(!container) return;
    
    let filteredCart = currentCart.filter(item => {
        if(currentCartFilter === 'all') return true;
        if(currentCartFilter === 'ملابس') return item.category.includes('ملابس');
        return item.category === currentCartFilter;
    });

    if(filteredCart.length === 0) { 
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">سلتك فارغة في هذا القسم. تصفح المنتجات وأضف ما يناسبك!</p>'; 
        document.getElementById('cartTotal').innerText = '0'; 
        return; 
    }

    container.innerHTML = '';
    let currency = document.getElementById('currencySelector') ? document.getElementById('currencySelector').value : 'EGP';
    let rate = currency === 'USD' ? 0.021 : 1; 
    let symbol = currency === 'USD' ? '$' : 'جنيه';

    filteredCart.forEach((item, index) => {
        let itemPrice = item.price * rate;
        total += itemPrice;
        container.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px dashed #333; padding-bottom:6px;">
                <span>• ${item.name} <small style="color:var(--accent);">(${item.category})</small></span> 
                <span><b>${itemPrice.toFixed(currency === 'USD' ? 2 : 0)} ${symbol}</b> 
                <button class="btn-red" style="padding:2px 6px; font-size:10px; width:auto; margin-right:8px;" onclick="currentCart.splice(${index},1); renderCart();">حذف</button></span>
            </div>`;
    });
    document.getElementById('cartTotal').innerText = total.toFixed(currency === 'USD' ? 2 : 0);
}

window.updateCartCurrency = function() {
    let currency = document.getElementById('currencySelector').value;
    let symbolEl = document.getElementById('currencyUnitSymbol');
    if(symbolEl) symbolEl.innerText = currency === 'USD' ? 'دولار' : 'جنيه';
    renderCart();
}

window.toggleWalletInput = function() {
    let method = document.getElementById('paymentMethodSelect').value;
    let walletContainer = document.getElementById('walletPhoneContainer');
    if(walletContainer) {
        if(method.includes('كاش') || method.includes('إنستاباي')) {
            walletContainer.style.display = 'block';
        } else {
            walletContainer.style.display = 'none';
        }
    }
}

window.checkoutCart = async function() {
    if(currentCart.length === 0) return alert('⚠️ سلة المشتريات فارغة!');

    let totalVal = document.getElementById('cartTotal').innerText;
    let currency = document.getElementById('currencySelector') ? document.getElementById('currencySelector').value : 'EGP';
    let paymentMethod = document.getElementById('paymentMethodSelect') ? document.getElementById('paymentMethodSelect').value : 'نقداً';
    let walletPhone = document.getElementById('walletSenderPhone') ? document.getElementById('walletSenderPhone').value : '';

    let orderId = 'GITI-' + Math.floor(1000 + Math.random() * 9000);
    let newOrder = {
        id: orderId,
        customer: currentUser.name,
        phone: currentUser.phone,
        items: [...currentCart],
        total: totalVal + ' ' + (currency === 'USD' ? 'دولار' : 'جنيه'),
        payment: paymentMethod + (walletPhone ? ` (من رقم: ${walletPhone})` : ''),
        date: new Date().toLocaleDateString('ar-EG') + ' ' + new Date().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})
    };

    await syncDataToCloud("orders", newOrder, orderId);
    window.addNotification(`🛒 تم تسجيل طلب جديد برقم #${newOrder.id} بقيمة ${newOrder.total}`);

    activeInvoice = newOrder;
    currentCart = [];
    
    renderCart();
    renderOrders();
    renderInvoicesArchive();
    renderFinancialReports();

    alert('✅ تم تأكيد طلبك سحابياً بنجاح وإصدار الفاتورة الرسمية!');
    window.openInvoiceModal(newOrder);
}

window.submitRFQ = async function() {
    let comp = document.getElementById('rfqCompanyName').value.trim();
    let specs = document.getElementById('rfqSpecs').value.trim();
    let qty = document.getElementById('rfqQty').value.trim();
    if(!comp || !specs || !qty) return alert('يرجى ملء كافة تفاصيل طلب عروض الأسعار (RFQ)!');
    
    let rfqData = { comp, specs, qty, date: new Date().toLocaleDateString('ar-EG') };
    await syncDataToCloud("rfqs", rfqData);
    window.addNotification(`📋 تم استلام طلب عرض سعر (RFQ) من: ${comp}`);
    alert('✅ تم إرسال طلب عروض الأسعار سحابياً بنجاح وسيتم الرد خلال 24 ساعة.');
    
    document.getElementById('rfqCompanyName').value = '';
    document.getElementById('rfqSpecs').value = '';
    document.getElementById('rfqQty').value = '';
    window.switchTab('storeTab');
}

window.submitB2BVerification = async function() {
    let name = document.getElementById('b2bName').value.trim();
    let cr = document.getElementById('b2bCR').value.trim();
    let tax = document.getElementById('b2bTax').value.trim();
    if(!name || !cr || !tax) return alert('يرجى إدخال بيانات السجل التجاري والبطاقة الضريبية بالكامل!');
    
    let verData = { name, cr, tax, date: new Date().toLocaleDateString('ar-EG') };
    await syncDataToCloud("b2b_verifications", verData);
    window.addNotification(`🔐 قدمت شركة (${name}) طلب توثيق تجاري جديد.`);
    alert('✅ تم تقديم طلب التوثيق سحابياً بنجاح!');
    
    document.getElementById('b2bName').value = '';
    document.getElementById('b2bCR').value = '';
    document.getElementById('b2bTax').value = '';
    window.switchTab('storeTab');
}

window.openInvoiceModal = function(order) {
    document.getElementById('invModalId').innerText = 'رقم الفاتورة: #' + order.id;
    document.getElementById('invModalDate').innerText = 'التاريخ: ' + order.date;
    document.getElementById('invModalClient').innerText = order.customer;
    document.getElementById('invModalPhone').innerText = order.phone;
    document.getElementById('invModalPayment').innerText = order.payment || 'تحويل بنكي';
    document.getElementById('invModalTotal').innerText = order.total;

    let tbody = document.getElementById('invModalItems');
    if(tbody) {
        tbody.innerHTML = '';
        order.items.forEach(it => {
            tbody.innerHTML += `<tr><td>${it.name}</td><td>1</td><td>${it.price}</td><td>${it.price}</td></tr>`;
        });
    }
    window.switchTab('invoiceModal');
    activeInvoice = order;
}

window.downloadInvoiceImage = function() {
    let element = document.getElementById('printableInvoice');
    if(!element) return;
    html2canvas(element).then(canvas => {
        let link = document.createElement('a');
        link.download = (activeInvoice ? activeInvoice.id : 'Invoice') + '.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

window.downloadInvoiceWord = function() {
    if(!activeInvoice) return alert('لا توجد فاتورة نشطة حالياً!');
    
    let htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Invoice B2B</title></head>
        <body style="direction: rtl; font-family: 'Segoe UI', Tahoma, sans-serif;">
            <h1 style="color: #00a4ef; text-align: center;">GITI EXPORT B2B</h1>
            <h3 style="text-align: center;">فاتورة تجارية وعقد توريد رسمي</h3>
            <p><b>رقم الفاتورة:</b> #${activeInvoice.id}</p>
            <p><b>التاريخ:</b> ${activeInvoice.date}</p>
            <p><b>اسم العميل / الشركة:</b> ${activeInvoice.customer} (${activeInvoice.phone})</p>
            <p><b>طريقة الدفع:</b> ${activeInvoice.payment}</p>
            <table border="1" style="width: 100%; border-collapse: collapse; text-align: right;">
                <thead>
                    <tr style="background: #0f172a; color: #00a4ef;">
                        <th style="padding: 8px;">المنتج</th>
                        <th style="padding: 8px;">الكمية</th>
                        <th style="padding: 8px;">السعر</th>
                        <th style="padding: 8px;">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${activeInvoice.items.map(it => `<tr><td style="padding: 8px;">${it.name}</td><td style="padding: 8px;">1</td><td style="padding: 8px;">${it.price}</td><td style="padding: 8px;">${it.price}</td></tr>`).join('')}
                </tbody>
            </table>
            <h3 style="text-align: left; margin-top: 20px;">الإجمالي الكلي: ${activeInvoice.total}</h3>
        </body>
        </html>
    `;

    let blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = `${activeInvoice.id}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function renderInvoicesArchive() {
    let container = document.getElementById('invoicesArchiveList');
    if(!container || !currentUser) return;
    let list = invoicesArchive;
    if(currentUser.role !== 'مدير') {
        list = invoicesArchive.filter(i => i.customer === currentUser.name);
    }
    if(list.length === 0) { container.innerHTML = 'لا توجد فواتير مسجلة في الأرشيف حالياً.'; return; }
    container.innerHTML = '';
    list.forEach(inv => {
        container.innerHTML += `
            <div class="item-row">
                <div>
                    <b>فاتورة رقم: #${inv.id}</b> - الإجمالي: <b style="color:var(--accent);">${inv.total}</b><br>
                    <small>العميل: ${inv.customer} | التاريخ: ${inv.date} | الدفع: ${inv.payment}</small>
                </div>
                <div style="display:flex; gap:5px;">
                    <button class="btn-gold" style="width:auto; padding:5px 8px; font-size:11px;" onclick="openInvoiceModal(invoicesArchive.find(x => x.id === '${inv.id}'))">👁️ مشاهدة</button>
                </div>
            </div>
        `;
    });
}

function renderWarehouseManagement() {
    let container = document.getElementById('warehouseItemsList');
    if(!container) return;
    if(inventory.length === 0) { container.innerHTML = 'المستودع فارغ.'; return; }
    container.innerHTML = '';
    inventory.forEach(item => {
        container.innerHTML += `
            <div class="item-row">
                <div><b>${item.name}</b> (${item.category})<br><small>السعر: ${item.price} ج.م | المخزون المتاح: <b>${item.qty} قطعة</b></small></div>
                <button class="btn-red" style="width:auto; padding:4px 8px; font-size:11px;" onclick="deleteWarehouseItem('${item.id}')">حذف</button>
            </div>
        `;
    });
}

window.deleteWarehouseItem = function(id) {
    inventory = inventory.filter(i => i.id != id);
    renderStore();
    renderWarehouseManagement();
}

function renderOrders() {
    let container = document.getElementById('ordersList');
    if(!container || !currentUser) return;
    let list = orders;
    if(currentUser.role !== 'مدير') {
        list = orders.filter(o => o.customer === currentUser.name);
    }
    if(list.length === 0) { container.innerHTML = 'لا توجد طلبات مسجلة بعد.'; return; }
    container.innerHTML = '';
    list.forEach(o => {
        container.innerHTML += `
            <div class="item-row">
                <div>
                    <b>طلب: ${o.id}</b> - الإجمالي: <b style="color:var(--accent);">${o.total}</b><br>
                    <small>العميل: ${o.customer} (${o.phone}) | التاريخ: ${o.date}</small>
                </div>
                <button class="btn-gold" style="width:auto; padding:6px 10px; font-size:11px;" onclick="openInvoiceModal(orders.find(x => x.id === '${o.id}'))">🧾 عرض الفاتورة</button>
            </div>
        `;
    });
}

function renderFinancialReports() {
    let totalRev = invoicesArchive.reduce((acc, inv) => {
        let num = parseFloat(inv.total) || 0;
        return acc + num;
    }, 0);
    let netProfit = totalRev * 0.25; 
    let avgOrder = invoicesArchive.length > 0 ? (totalRev / invoicesArchive.length).toFixed(2) : 0;

    let revEl = document.getElementById('reportTotalRevenue');
    let profEl = document.getElementById('reportNetProfit');
    let avgEl = document.getElementById('reportAvgOrder');
    let txList = document.getElementById('financialTransactionsList');

    if(revEl) revEl.innerText = totalRev + ' ج.م';
    if(profEl) profEl.innerText = netProfit.toFixed(2) + ' ج.م';
    if(avgEl) avgEl.innerText = avgOrder + ' ج.م';

    if(txList) {
        if(invoicesArchive.length === 0) {
            txList.innerHTML = 'لا توجد معاملات مالية مسجلة بعد.';
        } else {
            txList.innerHTML = '';
            invoicesArchive.slice(-5).reverse().forEach(inv => {
                txList.innerHTML += `
                    <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #333; padding:6px 0; font-size:12px;">
                        <span>🧾 فاتورة #${inv.id} (${inv.customer})</span>
                        <span style="color:#48bb78; font-weight:bold;">+${inv.total}</span>
                    </div>`;
            });
        }
    }
}

window.addNotification = async function(text) {
    let notifObj = { id: Date.now(), text, date: new Date().toLocaleDateString('ar-EG') };
    notifications.unshift(notifObj);
    await syncDataToCloud("notifications", notifObj);
    renderNotifications();
}

function renderNotifications() {
    let container = document.getElementById('notificationsListContainer');
    let badge = document.getElementById('notifBadge');
    if(badge) badge.innerText = notifications.length;
    if(!container) return;
    if(notifications.length === 0) {
        container.innerHTML = 'لا توجد إشعارات جديدة.';
        return;
    }
    container.innerHTML = '';
    notifications.forEach(n => {
        container.innerHTML += `
            <div style="background:#090d16; border:1px solid var(--border-color); padding:8px 12px; border-radius:8px; margin-bottom:6px; font-size:13px;">
                <span>🔔 ${n.text}</span><br>
                <small style="color:var(--text-muted); font-size:10px;">${n.date}</small>
            </div>`;
    });
}

window.clearNotifications = function() {
    notifications = [];
    renderNotifications();
}

function updateStats() {
    let pCount = document.getElementById('statProductsCount');
    let oCount = document.getElementById('statOrdersCount');
    let iCount = document.getElementById('statInvoicesCount');
    if(pCount) pCount.innerText = inventory.length;
    if(oCount) oCount.innerText = orders.length;
    if(iCount) iCount.innerText = invoicesArchive.length;
}

window.sendChatMessage = async function() {
    let txt = document.getElementById('chatInput').value.trim();
    if(!txt || !currentUser) return;
    let senderName = currentUser.name;
    let senderRole = currentUser.role === 'مدير' ? 'مدير المنصة 🔐' : 'شركة معتمدة 🏢';
    let senderAvatar = currentUser.avatar || '';
    
    let chatMsg = { 
        sender: senderName, 
        role: senderRole, 
        avatar: senderAvatar, 
        text: txt, 
        type: currentUser.role === 'مدير' ? 'outgoing' : 'incoming',
        time: Date.now()
    };
    
    await syncDataToCloud("chats", chatMsg);
    let chatInput = document.getElementById('chatInput');
    if(chatInput) chatInput.value = '';
}

function renderChat() {
    let box = document.getElementById('chatMessages');
    if(!box) return;
    box.innerHTML = '';
    chatLogs.forEach(msg => {
        let avTag = msg.avatar ? `<img src="${msg.avatar}" style="width:24px; height:24px; border-radius:50%; vertical-align:middle; margin-left:5px; object-fit:cover; border:1px solid var(--accent);" alt="av">` : `<i class="fa-solid fa-user-circle" style="margin-left:5px;"></i>`;
        box.innerHTML += `
            <div class="chat-msg ${msg.type === 'outgoing' ? 'msg-outgoing' : 'msg-incoming'}" style="display:flex; flex-direction:column; gap:3px;">
                <div style="font-size:11px; opacity:0.8; display:flex; align-items:center;">
                    ${avTag} <b>${msg.sender}</b> <span style="font-size:9px; background:rgba(0,0,0,0.3); padding:1px 4px; border-radius:3px; margin-right:5px;">${msg.role || ''}</span>
                </div>
                <div>${msg.text}</div>
            </div>`;
    });
    box.scrollTop = box.scrollHeight;
}
