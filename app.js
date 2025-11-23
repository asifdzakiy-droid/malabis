// Konfigurasi WhatsApp
const WHATSAPP_NUMBER = '6285815248375'; // Ganti dengan nomor WhatsApp Anda (tanpa +)

// Konfigurasi Google Sheets
// Cara mendapatkan URL:
// 1. Buka Google Sheets Anda
// 2. File > Share > Publish to web
// 3. Pilih format: CSV atau "Web page"
// 4. Copy URL yang diberikan
// 5. Untuk CSV: Gunakan URL yang berakhir dengan /export?format=csv&gid=0
//    Atau untuk published sheet: ganti /pubhtml dengan /pub?output=csv
// URL Google Sheets Anda (format CSV)
const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSFAYEwAAfpCN0v6G2F5T3wblxdH9cb104t3JY7p1gRkOOYfgG7MmBt6AIerT-Qy7W9kLgQpMT4Seog/pub?output=csv';
// Kosongkan string di atas jika ingin menggunakan Excel lokal
// Contoh format CSV: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0'
// Contoh format CSV (published): 'https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?output=csv'

// Data Produk - akan dimuat dari Google Sheets atau Excel
let products = [];
// Cart Management
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Fungsi untuk membaca data dari Google Sheets (CSV format)
async function loadProductsFromGoogleSheets() {
    const loadingMsg = document.getElementById('loadingMessage');
    const productsGrid = document.getElementById('productsGrid');
    
    try {
        // Tampilkan loading
        if (loadingMsg) loadingMsg.style.display = 'block';
        if (productsGrid) productsGrid.style.display = 'none';
        
        if (!GOOGLE_SHEETS_URL) {
            throw new Error('URL Google Sheets belum dikonfigurasi');
        }
        
        // Baca dari Google Sheets (CSV format)
        const response = await fetch(GOOGLE_SHEETS_URL);
        
        if (!response.ok) {
            throw new Error('Gagal membaca data dari Google Sheets');
        }
        
        const csvText = await response.text();
        
        // Parse CSV
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
            throw new Error('Data Google Sheets kosong atau tidak valid');
        }
        
        // Parse CSV menjadi array
        const parseCSVLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        };
        
        const jsonData = lines.map(line => parseCSVLine(line));
        
        // Proses data - asumsikan baris pertama adalah header
        const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
        
        // Process data menggunakan fungsi yang sama dengan Excel
        processDataRows(jsonData, headers);
        
        console.log(`Berhasil memuat ${products.length} produk dari Google Sheets`);
        
        // Sembunyikan loading dan render produk
    if (loadingMsg) loadingMsg.style.display = 'none';
    if (productsGrid) productsGrid.style.display = 'grid';
        
    // Setup category filters and render with any active filters
    renderCategoryFilters();
    applyFilters();
        
    } catch (error) {
        console.error('Error loading Google Sheets:', error);
        
        // Tampilkan error message
        if (loadingMsg) {
            loadingMsg.innerHTML = `<div style="color: var(--danger-color);">
                <p>Gagal memuat data dari Google Sheets: ${error.message}</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">
                    Pastikan URL Google Sheets sudah dikonfigurasi dengan benar di app.js
                </p>
            </div>`;
        }
        
        // Fallback: gunakan data kosong atau data default
    products = [];
    renderCategoryFilters();
    applyFilters();
    }
}

// Fungsi untuk memproses baris data (dipakai oleh Excel dan Google Sheets)
function processDataRows(jsonData, headers) {
    // Cari index kolom
    const getColumnIndex = (colNames) => {
        for (const colName of colNames) {
            const idx = headers.findIndex(h => h.includes(colName));
            if (idx !== -1) return idx;
        }
        return -1;
    };
    
    const idxNo = getColumnIndex(['no', 'nomor']);
    const idxKode = getColumnIndex(['kode', 'code']);
    const idxKategori = getColumnIndex(['kategori', 'category']);
    const idxBahan = getColumnIndex(['bahan', 'material']);
    const idxVariasi = getColumnIndex(['variasi', 'variant', 'varian']);
    const idxJual1 = getColumnIndex(['jual1', 'jual', 'harga', 'price']);
    const idxJual12 = getColumnIndex(['jual12', 'harga grosir']);
    const idxGambar1 = getColumnIndex(['gambar1', 'gambar', 'image', 'img']);
    const idxSuplier = getColumnIndex(['suplier', 'supplier']);
    
    // Proses setiap baris data
    products = [];
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        // Skip baris kosong
        if (!row || row.length === 0 || !row[idxKode]) continue;
        
        const kode = String(row[idxKode] || '').trim();
        if (!kode) continue;
        
        // Ekstrak folder dari kode (contoh: HPJYTD-0001 -> HPJYTD)
        const folder = kode.split('-')[0];
        
        const kategori = String(row[idxKategori] || '').trim() || 'Produk';
        const bahan = String(row[idxBahan] || '').trim() || '';
        const variasi = String(row[idxVariasi] || '').trim() || '';
    const jual1 = parseFloat(row[idxJual1] || 0) || 0;
    const jual12Val = parseFloat(row[idxJual12] || 0) || 0;
        
        // Buat nama produk
        let name = kategori;
        if (variasi) name += ' ' + variasi;
        if (!name.trim()) name = kode;
        
        // Buat deskripsi
        let description = '';
        if (bahan) description += 'Bahan ' + bahan;
        if (variasi) {
            if (description) description += ', ';
            description += 'Variasi ' + variasi;
        }
        if (!description) description = 'Produk berkualitas';
        
        // Ambil gambar - bisa sudah ada ekstensi atau belum
        let gambar1 = String(row[idxGambar1] || '').trim();
        if (!gambar1) {
            gambar1 = kode;
        }
        
        // Tambahkan ekstensi jika belum ada
        if (!gambar1.includes('.')) {
            const extension = folder === 'HPDPCA' ? '.jpg' : '.jpeg';
            gambar1 += extension;
        }
        
        products.push({
            id: kode,
            name: name,
            code: kode,
            price: jual1,
            jual12: jual12Val, // harga untuk pembelian >= 12 pcs
            description: description,
            category: kategori,
            folder: folder,
            bahan: bahan,
            variasi: variasi,
            gambar1: gambar1,
            suplier: String(row[idxSuplier] || '').trim() || ''
        });
    }
}

// Helper to determine unit price for a cart item (uses jual12 when quantity >= 12 and jual12 > 0)
function getUnitPriceForItem(item) {
    const product = products.find(p => p.id === item.id);
    if (!product) return item.price || 0;

    // If quantity 12 or more and wholesale price is provided, use it
    if (item.quantity >= 12 && product.jual12 && Number(product.jual12) > 0) {
        return Number(product.jual12);
    }

    // fallback to normal price stored in cart or product
    return item.price || product.price || 0;
}

// Fungsi utama untuk memuat produk (memilih Google Sheets atau Excel)
async function loadProducts() {
    if (GOOGLE_SHEETS_URL && GOOGLE_SHEETS_URL.trim() !== '') {
        // Gunakan Google Sheets jika URL dikonfigurasi
        await loadProductsFromGoogleSheets();
    } else {
        // Fallback ke Excel lokal
        await loadProductsFromExcel();
    }
}

// Fungsi untuk membaca data dari Excel (fallback)
async function loadProductsFromExcel() {
    const loadingMsg = document.getElementById('loadingMessage');
    const productsGrid = document.getElementById('productsGrid');
    
    try {
        // Tampilkan loading
        if (loadingMsg) loadingMsg.style.display = 'block';
        if (productsGrid) productsGrid.style.display = 'none';
        
        // Baca file Excel
        const excelPath = 'PRODUK/database.xlsx';
        const response = await fetch(excelPath);
        
        if (!response.ok) {
            throw new Error('File Excel tidak ditemukan');
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Ambil sheet pertama
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Konversi ke JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: ''
        });
        
        // Proses data - asumsikan baris pertama adalah header
        if (jsonData.length < 2) {
            throw new Error('Data Excel kosong atau tidak valid');
        }
        
        const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
        
        // Process data menggunakan fungsi yang sama dengan Google Sheets
        processDataRows(jsonData, headers);
        
        console.log(`Berhasil memuat ${products.length} produk dari Excel`);
        
        // Sembunyikan loading dan render produk
    if (loadingMsg) loadingMsg.style.display = 'none';
    if (productsGrid) productsGrid.style.display = 'grid';
        
    // Setup category filters and render
    renderCategoryFilters();
    applyFilters();
        
    } catch (error) {
        console.error('Error loading Excel:', error);
        
        // Tampilkan error message
        if (loadingMsg) {
            loadingMsg.innerHTML = `<div style="color: var(--danger-color);">
                <p>Gagal memuat data dari Excel: ${error.message}</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">
                    Pastikan file PRODUK/database.xlsx ada dan dapat diakses.
                </p>
            </div>`;
        }
        
        // Fallback: gunakan data kosong atau data default
    products = [];
    renderCategoryFilters();
    applyFilters();
    }
}

// Helper Functions
function formatRupiah(amount) {
    return 'Rp' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function getImageUrl(product) {
    // Path: PRODUK/GambarProduk/{FOLDER}/{CODE}.jpg atau .jpeg
    const folder = product.folder || product.code.split('-')[0];
    
    // Gunakan gambar1 jika ada, jika tidak gunakan code
    const imageFile = product.gambar1 || product.code;
    
    // Coba cek ekstensi berdasarkan folder (HPDPCA menggunakan .jpg, lainnya .jpeg)
    // Default ke .jpeg karena sebagian besar file menggunakan .jpeg
    let extension = folder === 'HPDPCA' ? '.jpg' : '.jpeg';
    
    // Jika imageFile sudah punya ekstensi, gunakan yang ada
    if (imageFile.includes('.')) {
        return `PRODUK/GambarProduk/${folder}/${imageFile}`;
    }
    
    // Browser akan handle error jika file tidak ada dengan onerror handler
    return `PRODUK/GambarProduk/${folder}/${imageFile}${extension}`;
}

// Render Products (accept optional list to render filtered results)
function renderProducts(list = products) {
    const grid = document.getElementById('productsGrid');

    if (!list || list.length === 0) {
        grid.innerHTML = '<div class="loading">Tidak ada produk tersedia.</div>';
        return;
    }

    grid.innerHTML = list.map(product => `
        <div class="product-card" onclick="openProductModal('${product.id}')">
            <img src="${getImageUrl(product)}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
            <button class="cart-btn-icon" aria-label="Tambah ke keranjang" title="Tambah ke keranjang" onclick="event.stopPropagation(); addToCart('${product.id}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <div class="product-info">
                <div class="product-code">${product.code}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">${formatRupiah(product.price)}</div>
            </div>
        </div>
    `).join('');
}

// Render category filter options based on loaded products
function renderCategoryFilters() {
    const select = document.getElementById('categoryFilter');
    if (!select) return;

    // Get unique categories
    const cats = Array.from(new Set(products.map(p => (p.category || 'Produk').trim()))).sort();

    // Clear except default
    select.innerHTML = '<option value="">Semua Kategori</option>' + cats.map(c => `
        <option value="${c}">${c}</option>
    `).join('');
}

// Apply search, category and sort filters then render
function applyFilters() {
    const searchEl = document.getElementById('searchInput');
    const categoryEl = document.getElementById('categoryFilter');
    const sortEl = document.getElementById('sortFilter');

    const q = (searchEl?.value || '').toLowerCase().trim();
    const cat = (categoryEl?.value || '').trim();
    const sort = (sortEl?.value || '');

    let list = products.slice();

    if (cat) {
        list = list.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase());
    }

    if (q) {
        list = list.filter(p => {
            return (
                (p.name || '').toLowerCase().includes(q) ||
                (p.code || '').toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q) ||
                (p.category || '').toLowerCase().includes(q)
            );
        });
    }

    if (sort === 'price-asc') {
        list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
        list.sort((a, b) => b.price - a.price);
    }

    renderProducts(list);
}

// Cart Functions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            code: product.code,
            name: product.name,
            price: product.price,
            quantity: 1,
            folder: product.folder
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification('Produk ditambahkan ke keranjang');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
}

function updateQuantity(index, delta) {
    cart[index].quantity += delta;
    
    if (cart[index].quantity < 1) {
        cart[index].quantity = 1;
    }
    
    saveCart();
    updateCartUI();
}

function clearCart() {
    if (confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
        cart = [];
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function getCartTotal() {
    return cart.reduce((total, item) => {
        const unit = getUnitPriceForItem(item);
        return total + (unit * item.quantity);
    }, 0);
}

function getCartCount() {
    return cart.reduce((count, item) => count + item.quantity, 0);
}

// Render Cart
function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    const cartBody = document.getElementById('cartBody');

    if (!container) return; // nothing to render into

    if (cart.length === 0) {
        container.innerHTML = '<div class="cart-empty">Keranjang kosong</div>';
        return;
    }

    container.innerHTML = cart.map((item, index) => {
        const unit = getUnitPriceForItem(item);
        const subtotal = unit * item.quantity;
        // Pastikan item punya folder property
        const productForImage = item.folder ? item : products.find(p => p.id === item.id) || item;
        const imageUrl = getImageUrl(productForImage);
        
        return `
            <div class="cart-item">
                <img src="${imageUrl}" 
                     alt="${item.name}" 
                     class="cart-item-image"
                     onerror="this.src='https://via.placeholder.com/100?text=No+Image'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-code">${item.code}</div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                        <span class="cart-item-subtotal">${formatRupiah(subtotal)}</span>
                    </div>
                    ${ (unit !== item.price) ? `<div style="font-size:0.8rem;color:var(--text-secondary);">Unit: ${formatRupiah(unit)} (harga grosir)</div>` : '' }
                    <button class="cart-item-remove" onclick="removeFromCart(${index})">Hapus</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateCartUI() {
    renderCart();
    updateCartTotal();
    updateCartBadge();
}

function updateCartTotal() {
    const total = getCartTotal();
    document.getElementById('cartTotal').textContent = formatRupiah(total);
}

function updateCartBadge() {
    const count = getCartCount();
    document.getElementById('cartBadge').textContent = count;
}

// Checkout via WhatsApp dengan format struk yang rapi
function checkoutToWhatsApp() {
    if (cart.length === 0) {
        alert('Keranjang kosong. Silakan tambahkan produk terlebih dahulu.');
        return;
    }
    
    const buyerName = document.getElementById('buyerName').value.trim();
    const buyerPhone = document.getElementById('buyerPhone').value.trim();
    const buyerProvince = document.getElementById('buyerProvince').selectedOptions[0]?.text || '';
    const buyerCity = document.getElementById('buyerCity').selectedOptions[0]?.text || '';
    const buyerDistrict = document.getElementById('buyerDistrict').selectedOptions[0]?.text || '';
    const buyerVillage = document.getElementById('buyerVillage').selectedOptions[0]?.text || '';
    const buyerAddressDetail = document.getElementById('buyerAddressDetail').value.trim();
    const buyerNote = document.getElementById('buyerNote').value.trim();
    
    // Validasi
    if (!buyerName || !buyerPhone || !buyerProvince || !buyerCity || !buyerDistrict || !buyerVillage || !buyerAddressDetail) {
        alert('Mohon lengkapi semua field yang wajib diisi (*)');
        return;
    }
    
    // Format pesan seperti struk dengan WhatsApp formatting
    let message = '✨ *STRUK PEMESANAN* ✨\n';
    message += '=========================\n\n';

    message += '📦 *Detail Pesanan*\n';
    message += '-------------------------\n';

    cart.forEach((item, index) => {
        const unit = getUnitPriceForItem(item);
        const subtotal = unit * item.quantity;

        message += `\n${index + 1}. *${item.name}*\n`;
        message += `🆔 Kode: \`${item.code}\`\n`;
        message += `🔢 Qty: ${item.quantity} × ${formatRupiah(unit)}\n`;
        message += `💰 Subtotal: *${formatRupiah(subtotal)}*\n`;
    });

    message += '\n=========================\n';
    message += `🧾 *TOTAL: ${formatRupiah(getCartTotal())}*\n`;
    message += '=========================\n\n';

    message += '👤 *Data Pembeli*\n';
    message += '-------------------------\n';
    message += `Nama: *${buyerName}*\n`;
    message += `WhatsApp: *${buyerPhone}*\n\n`;

    message += '📍 *Alamat Pengiriman*\n';
    message += '-------------------------\n';
    message += `${buyerAddressDetail}\n`;
    message += `${buyerVillage}, ${buyerDistrict}\n`;
    message += `${buyerCity}, ${buyerProvince}\n\n`;

    if (buyerNote) {
        message += '📝 *Catatan*\n';
        message += '-------------------------\n';
        message += `${buyerNote}\n\n`;
    }

    

    // Encode & open WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

}

// Cart Sidebar Controls
function openCart() {
    document.getElementById('cartOverlay').classList.add('active');
    document.getElementById('cartSidebar').classList.add('active');
}

function closeCart() {
    document.getElementById('cartOverlay').classList.remove('active');
    document.getElementById('cartSidebar').classList.remove('active');
}

// Notification
function showNotification(message) {
    // Simple notification - bisa diganti dengan library toast jika diperlukan
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background-color: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// API Wilayah Indonesia
const API_WILAYAH = 'https://www.emsifa.com/api-wilayah-indonesia/api';

// Data wilayah (cache)
let provinces = [];
let cities = {};
let districts = {};
let villages = {};

// Load Provinsi
async function loadProvinces() {
    try {
        const response = await fetch(`${API_WILAYAH}/provinces.json`);
        if (!response.ok) throw new Error('Gagal memuat data provinsi');
        
        const data = await response.json();
        provinces = data;
        
        const select = document.getElementById('buyerProvince');
        if (!select) return;
        
        select.innerHTML = '<option value="">Pilih Provinsi *</option>';
        
        data.forEach(province => {
            const option = document.createElement('option');
            option.value = province.id;
            option.textContent = province.name;
            select.appendChild(option);
        });
        
        select.disabled = false;
    } catch (error) {
        console.error('Error loading provinces:', error);
        // Fallback: tidak menampilkan error, hanya log
    }
}

// Load Kabupaten/Kota berdasarkan Provinsi
async function loadCities(provinceId) {
    const select = document.getElementById('buyerCity');
    const districtSelect = document.getElementById('buyerDistrict');
    const villageSelect = document.getElementById('buyerVillage');
    
    if (!select || !districtSelect || !villageSelect) return;
    
    // Reset dependent selects
    districtSelect.innerHTML = '<option value="">Pilih Kecamatan *</option>';
    districtSelect.disabled = true;
    villageSelect.innerHTML = '<option value="">Pilih Desa/Kelurahan *</option>';
    villageSelect.disabled = true;
    
    if (!provinceId) {
        select.innerHTML = '<option value="">Pilih Kabupaten/Kota *</option>';
        select.disabled = true;
        return;
    }
    
    try {
        // Check cache
        if (cities[provinceId]) {
            populateSelect(select, cities[provinceId], 'Pilih Kabupaten/Kota *');
            return;
        }
        
        const response = await fetch(`${API_WILAYAH}/regencies/${provinceId}.json`);
        if (!response.ok) throw new Error('Gagal memuat data kabupaten/kota');
        
        const data = await response.json();
        cities[provinceId] = data;
        
        populateSelect(select, data, 'Pilih Kabupaten/Kota *');
        select.disabled = false;
    } catch (error) {
        console.error('Error loading cities:', error);
    }
}

// Load Kecamatan berdasarkan Kabupaten/Kota
async function loadDistricts(cityId) {
    const select = document.getElementById('buyerDistrict');
    const villageSelect = document.getElementById('buyerVillage');
    
    if (!select || !villageSelect) return;
    
    // Reset dependent select
    villageSelect.innerHTML = '<option value="">Pilih Desa/Kelurahan *</option>';
    villageSelect.disabled = true;
    
    if (!cityId) {
        select.innerHTML = '<option value="">Pilih Kecamatan *</option>';
        select.disabled = true;
        return;
    }
    
    try {
        // Check cache
        if (districts[cityId]) {
            populateSelect(select, districts[cityId], 'Pilih Kecamatan *');
            return;
        }
        
        const response = await fetch(`${API_WILAYAH}/districts/${cityId}.json`);
        if (!response.ok) throw new Error('Gagal memuat data kecamatan');
        
        const data = await response.json();
        districts[cityId] = data;
        
        populateSelect(select, data, 'Pilih Kecamatan *');
        select.disabled = false;
    } catch (error) {
        console.error('Error loading districts:', error);
    }
}

// Load Desa/Kelurahan berdasarkan Kecamatan
async function loadVillages(districtId) {
    const select = document.getElementById('buyerVillage');
    
    if (!select) return;
    
    if (!districtId) {
        select.innerHTML = '<option value="">Pilih Desa/Kelurahan *</option>';
        select.disabled = true;
        return;
    }
    
    try {
        // Check cache
        if (villages[districtId]) {
            populateSelect(select, villages[districtId], 'Pilih Desa/Kelurahan *');
            return;
        }
        
        const response = await fetch(`${API_WILAYAH}/villages/${districtId}.json`);
        if (!response.ok) throw new Error('Gagal memuat data desa/kelurahan');
        
        const data = await response.json();
        villages[districtId] = data;
        
        populateSelect(select, data, 'Pilih Desa/Kelurahan *');
        select.disabled = false;
    } catch (error) {
        console.error('Error loading villages:', error);
    }
}

// Helper function untuk populate select
function populateSelect(selectElement, data, placeholder) {
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
    
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        selectElement.appendChild(option);
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cart toggle
    document.getElementById('cartToggle').addEventListener('click', openCart);
    document.getElementById('cartClose').addEventListener('click', closeCart);
    document.getElementById('cartOverlay').addEventListener('click', closeCart);
    
    // Checkout and clear buttons
    // checkoutBtn is inside the order modal; keep binding if present
    const checkoutBtnEl = document.getElementById('checkoutBtn');
    if (checkoutBtnEl) checkoutBtnEl.addEventListener('click', checkoutToWhatsApp);
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    
    // Proceed from cart to order form (stepper inside sidebar)
    const proceedBtn = document.getElementById('proceedBtn');
    if (proceedBtn) proceedBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Keranjang kosong. Silakan tambahkan produk terlebih dahulu.');
            return;
        }
        showOrderStep();
    });
    
    // Wilayah dropdowns
    const provinceSelect = document.getElementById('buyerProvince');
    const citySelect = document.getElementById('buyerCity');
    const districtSelect = document.getElementById('buyerDistrict');
    const villageSelect = document.getElementById('buyerVillage');
    
    if (provinceSelect) {
        provinceSelect.addEventListener('change', (e) => {
            loadCities(e.target.value);
        });
    }
    
    if (citySelect) {
        citySelect.addEventListener('change', (e) => {
            loadDistricts(e.target.value);
        });
    }
    
    if (districtSelect) {
        districtSelect.addEventListener('change', (e) => {
            loadVillages(e.target.value);
        });
    }

    // Filters (category + sort)
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => applyFilters());
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', () => applyFilters());
    }
    
    // Load products (dari Google Sheets atau Excel)
    loadProducts();
    
    // Load provinces
    loadProvinces();
    
    // Initial cart UI
    updateCartUI();

    // Init carousel (if present)
    if (typeof initCarousel === 'function') initCarousel();

    // Product modal controls
    const modalOverlay = document.getElementById('productModalOverlay');
    const modalCloseBtn = document.getElementById('productModalClose');
    if (modalOverlay) modalOverlay.addEventListener('click', closeProductModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeProductModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeProductModal();
    });

    // Cart stepper controls: back button inside order step
    const backToCartBtn = document.getElementById('backToCartBtn');
    if (backToCartBtn) backToCartBtn.addEventListener('click', () => {
        showCartStep();
    });
    // Back button located in footer when order step is active
    const backFooterBtn = document.getElementById('backFooterBtn');
    if (backFooterBtn) backFooterBtn.addEventListener('click', () => {
        showCartStep();
    });
});

// Make functions available globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;
window.checkoutToWhatsApp = checkoutToWhatsApp;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;

// Product modal implementation
function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const overlay = document.getElementById('productModalOverlay');
    const modal = document.getElementById('productModal');
    if (overlay) overlay.classList.add('active');
    if (modal) modal.classList.add('active');
    if (modal) modal.setAttribute('aria-hidden', 'false');

    document.getElementById('modalImage').src = getImageUrl(product);
    document.getElementById('modalImage').alt = product.name;
    document.getElementById('modalTitle').textContent = product.name;
    document.getElementById('modalCode').textContent = product.code;
    document.getElementById('modalDescription').textContent = product.description;
    document.getElementById('modalCategory').textContent = product.category || '';
    // Show price and wholesale info
    document.getElementById('modalPrice').textContent = formatRupiah(product.price || 0);
    const wholesaleEl = document.getElementById('modalWholesale');
    if (product.jual12 && Number(product.jual12) > 0) {
        wholesaleEl.style.display = 'block';
        wholesaleEl.textContent = `Harga grosir (>=12): ${formatRupiah(product.jual12)}`;
    } else {
        wholesaleEl.style.display = 'none';
        wholesaleEl.textContent = '';
    }

    // qty default 1
    const qtyInput = document.getElementById('modalQty');
    qtyInput.value = 1;

    // store current product id on add button
    const addBtn = document.getElementById('modalAddToCart');
    addBtn.onclick = () => {
        const qty = parseInt(qtyInput.value) || 1;
        addToCartWithQuantity(productId, qty);
    };

    // qty controls
    document.getElementById('modalQtyPlus').onclick = () => qtyInput.value = Number(qtyInput.value || 0) + 1;
    document.getElementById('modalQtyMinus').onclick = () => qtyInput.value = Math.max(1, Number(qtyInput.value || 1) - 1);

    // focus for accessibility
    const modalEl = document.getElementById('productModal');
    if (modalEl) {
        modalEl.focus?.();
    }
}

function closeProductModal() {
    const overlay = document.getElementById('productModalOverlay');
    const modal = document.getElementById('productModal');
    if (overlay) overlay.classList.remove('active');
    if (modal) modal.classList.remove('active');
    if (modal) modal.setAttribute('aria-hidden', 'true');
}

// Order modal open/close (form terpisah dari cart)
// Cart stepper control: show order form inside cart sidebar
function showOrderStep() {
    const summary = document.getElementById('cartStepSummary');
    const order = document.getElementById('cartStepOrder');
    const orderFooter = document.getElementById('orderFooterActions');
    if (summary) summary.style.display = 'none';
    if (orderFooter) orderFooter.style.display = 'flex';
    if (order) order.style.display = 'block';

    // reset scroll and focus first input for usability
    const body = document.getElementById('cartBody');
    if (body) body.scrollTop = 0;
    setTimeout(() => {
        const nameInput = document.getElementById('buyerName');
        if (nameInput) nameInput.focus();
    }, 50);
}

function showCartStep() {
    const summary = document.getElementById('cartStepSummary');
    const order = document.getElementById('cartStepOrder');
    const orderFooter = document.getElementById('orderFooterActions');
    if (summary) summary.style.display = 'flex';
    if (orderFooter) orderFooter.style.display = 'none';
    if (order) order.style.display = 'none';

    // reset scroll
    const body = document.getElementById('cartBody');
    if (body) body.scrollTop = 0;
}

// Add to cart with quantity from modal
function addToCartWithQuantity(productId, qty) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(i => i.id === productId);
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({
            id: product.id,
            code: product.code,
            name: product.name,
            price: product.price,
            quantity: qty,
            folder: product.folder
        });
    }

    saveCart();
    updateCartUI();
    showNotification('Produk ditambahkan ke keranjang');
    closeProductModal();
}

/* Carousel JS: simple slider with nav, indicators and auto-rotate */
function initCarousel() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;

    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    const indicatorsWrap = carousel.querySelector('.carousel-indicators');
    let current = 0;
    let intervalId = null;

    // build indicators
    slides.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.setAttribute('aria-label', `Slide ${i+1}`);
        btn.addEventListener('click', () => goTo(i));
        indicatorsWrap.appendChild(btn);
    });

    const indicators = Array.from(indicatorsWrap.querySelectorAll('button'));

    function update() {
        track.style.transform = `translateX(-${current * 100}%)`;
        indicators.forEach((b, i) => b.classList.toggle('active', i === current));
    }

    function next() { current = (current + 1) % slides.length; update(); }
    function prev() { current = (current - 1 + slides.length) % slides.length; update(); }
    function goTo(i) { current = Math.max(0, Math.min(i, slides.length - 1)); update(); }

    if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetAuto(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetAuto(); });

    // auto rotate
    function startAuto() { intervalId = setInterval(next, 5000); }
    function stopAuto() { if (intervalId) { clearInterval(intervalId); intervalId = null; } }
    function resetAuto() { stopAuto(); startAuto(); }

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('touchstart', stopAuto);
    carousel.addEventListener('touchend', startAuto);

    // initialize
    update();
    startAuto();
}

