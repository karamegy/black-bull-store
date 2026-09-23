let registeredUsers = JSON.parse(localStorage.getItem('giti_export_all_users')) || [
    { name: 'admin', phone: 'admin', role: 'مدير', password: '123', avatar: '', cover: '' }
];
let currentUser = JSON.parse(localStorage.getItem('giti_export_user')) || null;
let inventory = JSON.parse(localStorage.getItem('giti_export_inventory')) || [
    { id: 1, name: 'جاكيت شتوي تصدير فاخر', category: 'تصدير دولي', price: 650, qty: 150, type: 'image', mediaUrl: 'https://via.placeholder.com/150/0f172a/00a4ef?text=Jacket' },
    { id: 2, name: 'طقم بنطلون وتيشرت جملة', category: 'جملة محلي', price: 300, qty: 80, type: 'image', mediaUrl: 'https://via.placeholder.com/150/1e293b/00a4ef?text=Set' },
    { id: 3, name: 'أقمشة قطنية فاخرة للبيع بالجملة', category: 'أقمشة ومنسوجات', price: 1200, qty: 200, type: 'image', mediaUrl: 'https://via.placeholder.com/150/111827/00a4ef?text=Fabrics' }
];
let orders = JSON.parse(localStorage.getItem('giti_export_orders')) || [];
let invoicesArchive = JSON.parse(localStorage.getItem('giti_export_invoices')) || [];
let chatLogs = JSON.parse(localStorage.getItem('giti_export_chats')) || [
    { sender: 'admin', role: 'مدير', avatar: '', text: 'أهلاً بك في دعم Giti Export B2B. نحن هنا لمساعدتك في أي استفسار تجاري أو لوجستي.' }
];
let notifications = JSON.parse(localStorage.getItem('giti_export_notifications')) || [
    { id: 1, text: '🎉 أهلاً بك في منصة Giti Export للتجارة والتصدير الدولي B2B!', date: 'اليوم' }
];
let rfqs = JSON.parse(localStorage.getItem('giti_b2b_rfqs')) || [];

let cart = [];
let currentFilter = 'all';
let tempNewProdMedia = null;
let tempNewProdMediaType = 'image';
let activeInvoice = null;

window.onload = function() {
    updateAuthUI();
    renderStore();
    renderWarehouseManagement();
    renderOrders();
    renderInvoicesArchive();
    renderChat();
    renderFinancialReports();
    renderNotifications();
    updateStats();
};

function toggleSidebar() {
    document.getElementById('sideDrawer').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

function toggleGPlusDrawer() {
    if(!currentUser) {
        alert('⚠️ يرجى تسجيل الدخول أولاً!');
        switchTab('authSection');
        return;
    }
    document.getElementById('gplusProfileDrawer').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

function closeAllDrawers() {
    document.getElementById('sideDrawer').classList.remove('open');
    document.getElementById('gplusProfileDrawer').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

function checkProfileDrawerAccess() {
    if (!currentUser) {
        alert('⚠️ يرجى تسجيل الدخول أولاً!');
        switchTab('authSection');
    } else {
        toggleGPlusDrawer();
    }
}

function openLightbox(url, type) {
    let lightbox = document.getElementById('mediaLightbox');
    let container = document.getElementById('lightboxContainer');
    if(type === 'video') {
        container.innerHTML = `<video src="${url}" class="media-lightbox-content" controls autoplay></video>`;
    } else {
        container.innerHTML = `<img src="${url}" class="media-lightbox-content" alt="Media">`;
    }
    lightbox.classList.add('active');
}

function closeLightbox() {
    document.getElementById('mediaLightbox').classList.remove('active');
    document.getElementById('lightboxContainer').innerHTML = '';
}

function setTheme(primary, accent, bg, card) {
    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--bg-color', bg);
    document.documentElement.style.setProperty('--card-bg', card);
}

function syncData() {
    localStorage.setItem('giti_export_inventory', JSON.stringify(inventory));
    localStorage.setItem('giti_export_orders', JSON.stringify(orders));
    localStorage.setItem('giti_export_invoices', JSON.stringify(invoicesArchive));
    localStorage.setItem('giti_export_chats', JSON.stringify(chatLogs));
    localStorage.setItem('giti_export_notifications', JSON.stringify(notifications));
    localStorage.setItem('giti_b2b_rfqs', JSON.stringify(rfqs));
    if(currentUser) localStorage.setItem('giti_export_user', JSON.stringify(currentUser));
    localStorage.setItem('giti_export_all_users', JSON.stringify(registeredUsers));
    updateStats();
    renderFinancialReports();
    renderNotifications();
}

function switchTab(tabId, btnElement = null) {
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
    closeAllDrawers();
}

function switchAuthMode(mode) {
    if(mode === 'login') {
        document.getElementById('loginFormContainer').classList.remove('hidden');
        document.getElementById('registerFormContainer').classList.add('hidden');
        document.getElementById('tabBtnLogin').className = 'btn-gold';
        document.getElementById('tabBtnRegister').className = 'btn-blue';
    } else {
        document.getElementById('loginFormContainer').classList.add('hidden');
        document.getElementById('registerFormContainer').classList.remove('hidden');
        document.getElementById('tabBtnLogin').className = 'btn-blue';
        document.getElementById('tabBtnRegister').className = 'btn-gold';
    }
}

function toggleAuthModal() {
    if(currentUser) {
        if(confirm('هل تريد تسجيل الخروج؟')) {
            currentUser = null;
            localStorage.removeItem('giti_export_user');
            updateAuthUI();
            switchTab('storeTab');
        }
    } else {
        switchTab('authSection');
    }
}

// دالة تسجيل الدخول السريع بحساب جوجل
function loginWithGoogle() {
    let googleName = prompt("أدخل اسم حساب جوجل الخاص بك:", "مستثمر تجاري");
    if(!googleName) return;
    let googleEmail = prompt("أدخل البريد الإلكتروني لحساب جوجل:", "user@gmail.com");
    if(!googleEmail) return;

    let existingUser = registeredUsers.find(u => u.phone === googleEmail || u.name === googleName);
    if(existingUser) {
        currentUser = existingUser;
    } else {
        currentUser = {
            name: googleName,
            phone: googleEmail,
            role: 'شركة / مستورد',
            password: 'google_secure_pass',
            avatar: 'https://via.placeholder.com/85/00a4ef/fff?text=' + encodeURIComponent(googleName.charAt(0)),
            cover: ''
        };
        registeredUsers.push(currentUser);
    }
    syncData();
    updateAuthUI();
    addNotification(`🌍 تم تسجيل الدخول بنجاح عبر حساب جوجل: ${currentUser.name}`);
    alert('✅ مرحباً بك، ' + currentUser.name + ' (تم تسجيل الدخول بحساب جوجل بنجاح)');
    switchTab('storeTab');
}

function performRegister() {
    let name = document.getElementById('regName').value.trim();
    let phoneOrEmail = document.getElementById('regPhone').value.trim();
    let role = document.getElementById('regRole').value;
    let password = document.getElementById('regPassword').value;

    if(!name || !phoneOrEmail || !password) return alert('الرجاء إدخال كافة بيانات التسجيل بدقة!');
    
    let existing = registeredUsers.find(u => u.phone === phoneOrEmail || u.name === name);
    if(existing) return alert('⚠️ هذا المستخدم أو البريد/الهاتف مسجل مسبقاً!');

    let newUser = { 
        name, 
        phone: phoneOrEmail, 
        role, 
        password, 
        avatar: 'https://via.placeholder.com/85/000/00a4ef?text=' + encodeURIComponent(name.charAt(0)), 
        cover: '' 
    };
    
    registeredUsers.push(newUser);
    currentUser = newUser;
    syncData();
    updateAuthUI();
    addNotification(`👤 تم إنشاء حساب جديد بنجاح باسم: ${name}`);
    alert('✅ تم إنشاء الحساب وتسجيل الدخول بنجاح!');
    switchTab('storeTab');
}

function performLogin() {
    let contact = document.getElementById('loginContactOrName').value.trim();
    let password = document.getElementById('loginPassword').value;
    
    if(!contact || !password) return alert('يرجى إدخال بيانات الدخول وكلمة المرور!');

    let user = registeredUsers.find(u => (u.phone === contact || u.name === contact) && u.password === password);
    if(!user) return alert('⚠️ بيانات الدخول غير صحيحة، تأكد من البريد/الهاتف وكلمة المرور!');
    
    currentUser = user;
    syncData();
    updateAuthUI();
    alert('✅ أهلاً بك مجدداً، ' + currentUser.name);
    switchTab('storeTab');
}

function updateAuthUI() {
    let btnTop = document.getElementById('authBtnTop');
    let greet = document.getElementById('quickUserGreet');
    let topAvatar = document.getElementById('topNavAvatar');
    
    if(currentUser) {
        btnTop.innerText = 'خروج'; btnTop.className = 'btn-red';
        greet.innerText = currentUser.name;
        
        if(currentUser.avatar) {
            topAvatar.src = currentUser.avatar;
            document.getElementById('gpAvatarImg').src = currentUser.avatar;
        } else {
            let defaultAv = 'https://via.placeholder.com/85/000/00a4ef?text=' + encodeURIComponent(currentUser.name.charAt(0));
            topAvatar.src = defaultAv;
            document.getElementById('gpAvatarImg').src = defaultAv;
        }
        topAvatar.style.display = 'block';

        document.getElementById('gpNameDisplay').innerText = currentUser.name;
        document.getElementById('gpContactDisplay').innerText = 'الهاتف: ' + currentUser.phone;
        document.getElementById('gpRoleBadge').innerText = currentUser.role === 'مدير' ? 'مدير المنصة 🔐' : (currentUser.role === 'شركة / مستورد' ? 'شركة معتمدة B2B 🏢' : 'عضو موثق 🛒');

        if(currentUser.cover) document.getElementById('gpCoverImg').src = currentUser.cover;
        else document.getElementById('gpCoverImg').src = 'https://via.placeholder.com/350x120/0f172a/00a4ef?text=Giti+Export+Cover';
    } else {
        btnTop.innerText = 'تسجيل الدخول'; btnTop.className = 'btn-gold';
        greet.innerText = 'زائرنا التجاري';
        topAvatar.style.display = 'none';
    }
}

function handleAvatarUpload(event) {
    let file = event.target.files[0];
    if(!file || !currentUser) return;
    let reader = new FileReader();
    reader.onload = function(e) {
        currentUser.avatar = e.target.result;
        let masterUser = registeredUsers.find(u => u.phone === currentUser.phone);
        if(masterUser) masterUser.avatar = currentUser.avatar;
        syncData();
        updateAuthUI();
        alert('✅ تم تحديث الصورة الشخصية للبروفايل بنجاح!');
    };
    reader.readAsDataURL(file);
}

function handleCoverUpload(event) {
    let file = event.target.files[0];
    if(!file || !currentUser) return;
    let reader = new FileReader();
    reader.onload = function(e) {
        currentUser.cover = e.target.result;
        let masterUser = registeredUsers.find(u => u.phone === currentUser.phone);
        if(masterUser) masterUser.cover = currentUser.cover;
        syncData();
        updateAuthUI();
        alert('✅ تم تحديث غلاف بروفايل Giti Plus بنجاح!');
    };
    reader.readAsDataURL(file);
}

function previewNewProductMedia(event) {
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

function saveNewProductToStore() {
    let name = document.getElementById('newProdName').value.trim();
    let price = parseFloat(document.getElementById('newProdPrice').value) || 0;
    let qty = parseInt(document.getElementById('newProdQty').value) || 1;
    let category = document.getElementById('newProdCategory').value;

    if(!name || !price) return alert('الرجاء إدخال اسم المنتج والسعر على الأقل!');
    if(!tempNewProdMedia) {
        tempNewProdMedia = 'https://via.placeholder.com/150/0f172a/00a4ef?text=Product';
    }

    let newProduct = {
        id: Date.now(),
        name, price, qty, category,
        type: tempNewProdMediaType,
        mediaUrl: tempNewProdMedia,
        addedBy: currentUser ? currentUser.name : 'إدارة النظام'
    };

    inventory.push(newProduct);
    syncData();
    renderStore();
    renderWarehouseManagement();
    addNotification(`📦 تمت إضافة منتج جديد: ${name} (${price} ج.م)`);

    document.getElementById('newProdName').value = '';
    document.getElementById('newProdPrice').value = '';
    document.getElementById('newProdMediaInput').value = '';
    document.getElementById('newProdMediaPreview').innerHTML = '';
    tempNewProdMedia = null;

    alert('✅ تمت إضافة المنتج ونشره في المتجر بنجاح تام!');
    switchTab('storeTab');
}

function filterCategory(cat, element) {
    currentFilter = cat;
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    element.classList.add('active');
    renderStore();
}

function renderStore() {
    let container = document.getElementById('storeProductsList');
    if(!container) return;
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
                    <small style="color:var(--accent); font-weight:bold;">سعر الجملة: ${item.price} ج.م</small><br>
                    <small style="display:block; color:var(--text-muted);">المتوفر بالمستودع: ${item.qty}</small>
                </div>
                <div style="display:flex; flex-direction:column; gap:4px; margin-top:5px;">
                    <button class="btn-blue" style="padding: 5px; font-size: 11px; margin:0;" onclick="addToCart(${item.id})">أضف للسلة 🛒</button>
                    <button class="btn-gold" style="padding: 4px; font-size: 10px; margin:0;" onclick="shareProduct('${item.name}', ${item.price})"><i class="fa-solid fa-share-nodes"></i> مشاركة 🌐</button>
                </div>
            </div>
        `;
    });
}

function shareProduct(name, price) {
    let shareText = `🚢 منصة Giti Export B2B للتجارة والتصدير الدولي\n📦 تسوق الآن منتج الجملة المميز: ${name}\n💰 السعر التجاري حصرياً: ${price} جنيه\n✨ اطلب الآن عبر المنصة وتواصل معنا مباشرة!`;
    if (navigator.share) {
        navigator.share({ title: name, text: shareText, url: window.location.href }).catch(() => {});
    } else {
        navigator.clipboard.writeText(shareText);
        alert('✅ تم نسخ رابط تفاصيل المنتج ونص المشاركة إلى الحافظة بنجاح!');
    }
}

function addToCart(id) {
    let item = inventory.find(i => i.id === id);
    if(!item || item.qty <= 0) return alert('عذراً، المنتج نفد من المستودع!');
    cart.push(item);
    renderCart();
    alert('✅ تمت إضافة المنتج إلى سلة طلبات الجملة بنجاح');
}

function renderCart() {
    let container = document.getElementById('cartItems');
    let total = 0;
    if(cart.length === 0) { container.innerHTML = 'السلة فارغة حالياً'; document.getElementById('cartTotal').innerText = '0'; return; }
    container.innerHTML = '';
    cart.forEach((item, index) => {
        total += item.price;
        container.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; border-bottom:1px dashed #333; padding-bottom:4px;">
                <span>• ${item.name}</span> 
                <span><b>${item.price} ج.م</b> <button class="btn-red" style="padding:2px 6px; font-size:10px; width:auto;" onclick="cart.splice(${index},1); renderCart();">حذف</button></span>
            </div>`;
    });
    document.getElementById('cartTotal').innerText = total;
}

function checkoutCart() {
    if(!currentUser) {
        alert('⚠️ يرجى تسجيل الدخول أولاً لإتمام طلبات الجملة وإصدار الفاتورة التجارية!');
        switchTab('authSection');
        return;
    }
    if(cart.length === 0) return alert('السلة فارغة!');

    let totalVal = parseFloat(document.getElementById('cartTotal').innerText);
    let paymentMethod = document.getElementById('paymentMethodSelect').value;
    
    cart.forEach(cartItem => {
        let st = inventory.find(i => i.id === cartItem.id);
        if(st) st.qty -= 1;
    });

    let newOrder = {
        id: 'B2B-' + Math.floor(1000 + Math.random() * 9000),
        customer: currentUser.name,
        phone: currentUser.phone,
        items: [...cart],
        total: totalVal,
        payment: paymentMethod,
        date: new Date().toLocaleDateString('ar-EG') + ' ' + new Date().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})
    };

    orders.push(newOrder);
    invoicesArchive.push(newOrder);
    syncData();
    
    activeInvoice = newOrder;
    cart = [];
    renderCart();
    renderStore();
    renderWarehouseManagement();
    renderOrders();
    renderInvoicesArchive();
    renderFinancialReports();
    addNotification(`🛒 تم إصدار طلب جملة جديد برقم #${newOrder.id} بقيمة ${totalVal} ج.م عبر (${paymentMethod})`);

    alert('✅ تم إتمام طلب الجملة بنجاح وتم إصدار الفاتورة التجارية الفورية!');
    openInvoiceModal(newOrder);
}

function submitRFQ() {
    let comp = document.getElementById('rfqCompanyName').value.trim();
    let specs = document.getElementById('rfqSpecs').value.trim();
    let qty = document.getElementById('rfqQty').value.trim();
    if(!comp || !specs || !qty) return alert('يرجى ملء كافة تفاصيل طلب عروض الأسعار (RFQ)!');
    
    rfqs.push({ comp, specs, qty, date: new Date().toLocaleDateString('ar-EG') });
    syncData();
    addNotification(`📋 تم استلام طلب عرض سعر (RFQ) جديد من شركة: ${comp}`);
    alert('✅ تم إرسال طلب عروض الأسعار بنجاح وسيتم الرد من قسم المبيعات والتصدير خلال 24 ساعة.');
    document.getElementById('rfqCompanyName').value = '';
    document.getElementById('rfqSpecs').value = '';
    document.getElementById('rfqQty').value = '';
    switchTab('storeTab');
}

function submitB2BVerification() {
    let name = document.getElementById('b2bName').value.trim();
    let cr = document.getElementById('b2bCR').value.trim();
    let tax = document.getElementById('b2bTax').value.trim();
    if(!name || !cr || !tax) return alert('يرجى إدخال بيانات السجل التجاري والبطاقة الضريبية بالكامل!');
    
    addNotification(`🔐 قدمت شركة (${name}) طلب توثيق تجاري جديد.`);
    alert('✅ تم تقديم طلب التوثيق بنجاح! سيتم مراجعة المستندات وتفعيل حساب الشركات واعتماد أسعار الجملة قريباً.');
    document.getElementById('b2bName').value = '';
    document.getElementById('b2bCR').value = '';
    document.getElementById('b2bTax').value = '';
    switchTab('storeTab');
}

function openInvoiceModal(order) {
    document.getElementById('invModalId').innerText = 'رقم الفاتورة: #' + order.id;
    document.getElementById('invModalDate').innerText = 'التاريخ: ' + order.date;
    document.getElementById('invModalClient').innerText = order.customer;
    document.getElementById('invModalPhone').innerText = order.phone;
    document.getElementById('invModalPayment').innerText = order.payment || 'تحويل بنكي';
    document.getElementById('invModalTotal').innerText = order.total;

    let tbody = document.getElementById('invModalItems');
    tbody.innerHTML = '';
    order.items.forEach(it => {
        tbody.innerHTML += `<tr><td>${it.name}</td><td>1</td><td>${it.price} ج.م</td><td>${it.price} ج.م</td></tr>`;
    });
    switchTab('invoiceModal');
    activeInvoice = order;
}

function downloadInvoiceImage() {
    let element = document.getElementById('printableInvoice');
    html2canvas(element).then(canvas => {
        let link = document.createElement('a');
        link.download = (activeInvoice ? activeInvoice.id : 'Invoice') + '.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

function downloadInvoiceWord() {
    if(!activeInvoice) return alert('لا توجد فاتورة نشطة حالياً!');
    
    let htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Invoice B2B</title></head>
        <body style="direction: rtl; font-family: 'Segoe UI', Tahoma, sans-serif;">
            <h1 style="color: #00a4ef; text-align: center;">GITI EXPORT B2B</h1>
            <h3 style="text-align: center;">فاتورة تجارية وعقد توريد جملة رسمي</h3>
            <p><b>رقم الفاتورة:</b> #${activeInvoice.id}</p>
            <p><b>التاريخ:</b> ${activeInvoice.date}</p>
            <p><b>اسم الشركة / العميل:</b> ${activeInvoice.customer} (${activeInvoice.phone})</p>
            <p><b>طريقة الدفع B2B:</b> ${activeInvoice.payment || 'تحويل بنكي'}</p>
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
                    ${activeInvoice.items.map(it => `<tr><td style="padding: 8px;">${it.name}</td><td style="padding: 8px;">1</td><td style="padding: 8px;">${it.price} ج.م</td><td style="padding: 8px;">${it.price} ج.م</td></tr>`).join('')}
                </tbody>
            </table>
            <h3 style="text-align: left; margin-top: 20px;">الإجمالي الكلي: ${activeInvoice.total} جنيه</h3>
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
    if(!container) return;
    let list = invoicesArchive;
    if(currentUser && currentUser.role !== 'مدير') {
        list = invoicesArchive.filter(i => i.customer === currentUser.name);
    }
    if(list.length === 0) { container.innerHTML = 'لا توجد فواتير تجارية مسجلة في الأرشيف حالياً.'; return; }
    container.innerHTML = '';
    list.forEach(inv => {
        container.innerHTML += `
            <div class="item-row">
                <div>
                    <b>فاتورة رقم: #${inv.id}</b> - الإجمالي: <b style="color:var(--accent);">${inv.total} ج.م</b><br>
                    <small>العميل: ${inv.customer} | التاريخ: ${inv.date} | الدفع: ${inv.payment || 'تحويل بنكي'}</small>
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
                <button class="btn-red" style="width:auto; padding:4px 8px; font-size:11px;" onclick="deleteWarehouseItem(${item.id})">حذف</button>
            </div>
        `;
    });
}

function deleteWarehouseItem(id) {
    inventory = inventory.filter(i => i.id !== id);
    syncData();
    renderStore();
    renderWarehouseManagement();
}

function renderOrders() {
    let container = document.getElementById('ordersList');
    if(!container) return;
    let list = orders;
    if(currentUser && currentUser.role !== 'مدير') {
        list = orders.filter(o => o.customer === currentUser.name);
    }
    if(list.length === 0) { container.innerHTML = 'لا توجد طلبات جملة مسجلة بعد.'; return; }
    container.innerHTML = '';
    list.forEach(o => {
        container.innerHTML += `
            <div class="item-row">
                <div>
                    <b>طلب جملة: ${o.id}</b> - الإجمالي: <b style="color:var(--accent);">${o.total} ج.م</b><br>
                    <small>العميل/الشركة: ${o.customer} (${o.phone}) | التاريخ: ${o.date}</small>
                </div>
                <button class="btn-gold" style="width:auto; padding:6px 10px; font-size:11px;" onclick="openInvoiceModal(orders.find(x => x.id === '${o.id}'))">🧾 عرض الفاتورة</button>
            </div>
        `;
    });
}

function renderFinancialReports() {
    let totalRev = invoicesArchive.reduce((acc, inv) => acc + (inv.total || 0), 0);
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
                        <span>🧾 فاتورة B2B #${inv.id} (${inv.customer})</span>
                        <span style="color:#48bb78; font-weight:bold;">+${inv.total} ج.م</span>
                    </div>`;
            });
        }
    }
}

function addNotification(text) {
    notifications.unshift({ id: Date.now(), text, date: new Date().toLocaleDateString('ar-EG') });
    syncData();
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

function clearNotifications() {
    notifications = [];
    syncData();
}

function updateStats() {
    let pCount = document.getElementById('statProductsCount');
    let oCount = document.getElementById('statOrdersCount');
    let iCount = document.getElementById('statInvoicesCount');
    if(pCount) pCount.innerText = inventory.length;
    if(oCount) oCount.innerText = orders.length;
    if(iCount) iCount.innerText = invoicesArchive.length;
}

function sendChatMessage() {
    let txt = document.getElementById('chatInput').value.trim();
    if(!txt) return;
    let senderName = currentUser ? currentUser.name : 'زائرنا التجاري';
    let senderRole = currentUser ? (currentUser.role === 'مدير' ? 'مدير المنصة 🔐' : (currentUser.role === 'شركة / مستورد' ? 'شركة معتمدة B2B 🏢' : 'عضو موثق 🛒')) : 'زائر';
    let senderAvatar = currentUser && currentUser.avatar ? currentUser.avatar : '';
    
    chatLogs.push({ 
        sender: senderName, 
        role: senderRole, 
        avatar: senderAvatar, 
        text: txt, 
        type: currentUser && currentUser.role === 'مدير' ? 'outgoing' : 'incoming' 
    });
    syncData();
    renderChat();
    document.getElementById('chatInput').value = '';
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
