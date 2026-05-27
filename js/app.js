// โค้ดเชื่อมต่อ Google Apps Script Web App ของคุณ
const API_URL = "https://script.google.com/macros/s/AKfycbyFu_K3hntib05QfClrE_DiJWxbz8-4u1Mex1vi7he-9DrSU6G0HtPBgYswveeVpHCE/exec"; 

let allProducts = []; // เก็บตัวแปร Global ไว้กรองข้อมูล

document.addEventListener("DOMContentLoaded", () => {
    const productContainer = document.getElementById("product-list");
    if (productContainer) {
        initProductsPage(productContainer);
    }
});

// --- LOGIC สำหรับหน้า PRODUCTS.HTML (แสดงรายการทั้งหมดและกรองหมวดหมู่) ---
async function initProductsPage(container) {
    try {
        const response = await fetch(API_URL);
        allProducts = await response.json();
        
        if (allProducts.length === 0) {
            container.innerHTML = "<p>ไม่พบสินค้าในระบบ</p>";
            return;
        }

        // 1. สร้างปุ่มเมนู Category อัตโนมัติจากข้อมูลในแถว category ของ Google Sheet
        buildCategoryMenu();

        // 2. แสดงสินค้าทั้งหมดในตอนเริ่มต้น
        displayProducts(allProducts, container);

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p style='color:red;'>โหลดข้อมูลล้มเหลว</p>";
    }
}

function buildCategoryMenu() {
    const menuContainer = document.getElementById("category-menu");
    if (!menuContainer) return;

    // ดึงเฉพาะชื่อหมวดหมู่ที่ไม่ซ้ำกันออกมา (Unique Categories)
    const categories = ["ทั้งหมด", ...new Set(allProducts.map(p => p.category).filter(Boolean))];

    menuContainer.innerHTML = "";
    categories.forEach((cat, idx) => {
        const btn = document.createElement("button");
        btn.className = `category-btn ${idx === 0 ? 'active' : ''}`;
        btn.innerText = cat;
        btn.onclick = () => {
            // สลับ Class active ของปุ่ม
            document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // กรองสินค้าตามหมวดหมู่ที่กด
            const filtered = cat === "ทั้งหมด" ? allProducts : allProducts.filter(p => p.category === cat);
            displayProducts(filtered, document.getElementById("product-list"));
        };
        menuContainer.appendChild(btn);
    });
}

function displayProducts(productsList, container) {
    container.innerHTML = "";
    
    productsList.forEach((product, index) => {
        const card = document.createElement("div");
        card.className = "product-card";
        
        // ดึงรูปแรกมาโชว์ที่การ์ด
        const mainImg = product.image_url1 || 'https://placehold.co/400x400?text=No+Image';

        card.innerHTML = `
            <div class="main-img-container">
                <img src="${mainImg}" alt="${product.name}">
            </div>
            <div class="product-info">${product.brand} | โมเดล: ${product.model}</div>
            <h3>${product.name}</h3>
            <div class="price"><span>฿</span> ${Number(product.price).toLocaleString()}</div>
            <a href="product-detail.html?id=${product.id}" class="btn-inquire">ดูรายละเอียดสินค้า</a>
        `;
        container.appendChild(card);
    });
}


// --- LOGIC สำหรับหน้า PRODUCT-DETAIL.HTML (แสดงหน้ารายละเอียดรายตัว) ---
async function renderSingleProduct() {
    const detailContainer = document.getElementById("product-detail-container");
    if (!detailContainer) return;

    // 1. แกะค่า ID ของสินค้าจาก URL parameter เช่น ?id=PROD-001
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        detailContainer.innerHTML = "<p>ไม่พบรหัสสินค้าที่ระบุ</p>";
        return;
    }

    try {
        const response = await fetch(API_URL);
        const products = await response.json();
        
        // ค้นหาสินค้าที่มี ID ตรงกับใน URL
        const product = products.find(p => String(p.id) === String(productId));

        if (!product) {
            detailContainer.innerHTML = "<p>ไม่พบข้อมูลสินค้านี้ในระบบ</p>";
            return;
        }

        // 2. จัดการรูปภาพ (ดึง 1-5 รูป)
        const images = [];
        for (let i = 1; i <= 5; i++) {
            if (product[`image_url${i}`]) images.push(product[`image_url${i}`]);
        }
        if (images.length === 0) images.push('https://placehold.co/400x400?text=No+Image');

        let thumbsHTML = "";
        if (images.length > 1) {
            thumbsHTML = `<div class="thumb-row" style="margin-top:15px;">`;
            images.forEach(img => {
                thumbsHTML += `<img src="${img}" onclick="document.getElementById('detail-main').src = this.src">`;
            });
            thumbsHTML += `</div>`;
        }

        // 3. จัดการ Tag สินค้า (ใช้ข้อมูล Category และ แบรนด์ มาสร้างเป็น Tag อัตโนมัติ)
        // คุณสามารถปรับแต่งเพิ่มเติมในใจหรือสร้างคอลัมน์ tag ใน Sheet เพิ่มภายหลังได้
        const tags = [product.category, product.brand, `Model: ${product.model}`].filter(Boolean);
        let tagsHTML = `<div class="tag-container">`;
        tags.forEach(tag => {
            tagsHTML += `<span class="product-tag"><i class="fa-solid fa-tag"></i> ${tag}</span>`;
        });
        tagsHTML += `</div>`;

        // 4. พ่นโค้ดสร้างหน้าตาแบบเดี่ยวออกมา
        detailContainer.innerHTML = `
            <div class="detail-wrapper">
                <div class="detail-img-area">
                    <img id="detail-main" class="detail-main-img" src="${images[0]}" alt="${product.name}">
                    ${thumbsHTML}
                </div>
                
                <div class="detail-info-area">
                    <p style="text-transform:uppercase; font-size:0.85rem; color:#888; letter-spacing:1px;">
                        ${product.category} &gt; ${product.brand}
                    </p>
                    <h1>${product.name}</h1>
                    <p style="font-size:1.1rem; color:var(--medium-gray);"><b>รุ่น/โมเดล:</b> ${product.model}</p>
                    
                    ${tagsHTML}

                    <div class="price" style="font-size:2rem; margin:20px 0;"><span>฿</span> ${Number(product.price).toLocaleString()}</div>
                    
                    <div style="border-top:1px solid #ddd; padding-top:20px;">
                        <h3>ข้อมูลสเปกสินค้าเชิงลึก:</h3>
                        <p class="detail-desc">${product.detail}</p>
                    </div>

                    <a href="https://line.me/ti/p/@yourid" target="_blank" class="btn-inquire" style="display:block; margin-top:30px; padding:15px; font-size:1.1rem; font-weight:600;">
                        ติดต่อสั่งซื้อ / ขอใบเสนอราคาหน้างาน
                    </a>
                </div>
            </div>
        `;

    } catch (error) {
        console.error(error);
        detailContainer.innerHTML = "<p style='color:red;'>เกิดข้อผิดพลาดในการดึงรายละเอียดข้อมูล</p>";
    }
}

// ค้นหาฟังก์ชัน renderSingleProduct() ในไฟล์ js/app.js เดิม แล้วแทนที่ด้วยโค้ดชุดนี้:

async function renderSingleProduct() {
    const detailContainer = document.getElementById("product-detail-container");
    if (!detailContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        detailContainer.innerHTML = "<p>ไม่พบรหัสสินค้าที่ระบุ</p>";
        return;
    }

    try {
        const response = await fetch(API_URL);
        const products = await response.json();
        
        const product = products.find(p => String(p.id) === String(productId));

        if (!product) {
            detailContainer.innerHTML = "<p>ไม่พบข้อมูลสินค้านี้ในระบบ</p>";
            return;
        }

        // จัดการรูปภาพ (1-5 รูป)
        const images = [];
        for (let i = 1; i <= 5; i++) {
            if (product[`image_url${i}`]) images.push(product[`image_url${i}`]);
        }
        if (images.length === 0) images.push('https://placehold.co/400x400?text=No+Image');

        let thumbsHTML = "";
        if (images.length > 1) {
            thumbsHTML = `<div class="thumb-row" style="margin-top:15px;">`;
            images.forEach(img => {
                thumbsHTML += `<img src="${img}" onclick="document.getElementById('detail-main').src = this.src">`;
            });
            thumbsHTML += `</div>`;
        }

        // จัดการ Tag สินค้า
        const tags = [product.category, product.brand, `Model: ${product.model}`].filter(Boolean);
        let tagsHTML = `<div class="tag-container">`;
        tags.forEach(tag => {
            tagsHTML += `<span class="product-tag"><i class="fa-solid fa-tag"></i> ${tag}</span>`;
        });
        tagsHTML += `</div>`;

        // --- เพิ่มเติม: ตรวจสอบข้อมูลเอกสาร Documentation ---
        let docButtonHTML = "";
        if (product.documentation_url && product.documentation_url.trim() !== "") {
            docButtonHTML = `
                <a href="${product.documentation_url.trim()}" target="_blank" class="btn-download">
                    <i class="fa-solid fa-file-pdf"></i> ดาวน์โหลดคู่มือ / Datasheet (PDF)
                </a>
            `;
        }

        // พ่นโค้ดสร้างหน้าตาแบบเดี่ยว
        detailContainer.innerHTML = `
            <div class="detail-wrapper">
                <div class="detail-img-area">
                    <img id="detail-main" class="detail-main-img" src="${images[0]}" alt="${product.name}">
                    ${thumbsHTML}
                </div>
                
                <div class="detail-info-area">
                    <p style="text-transform:uppercase; font-size:0.85rem; color:#888; letter-spacing:1px;">
                        ${product.category} &gt; ${product.brand}
                    </p>
                    <h1>${product.name}</h1>
                    <p style="font-size:1.1rem; color:var(--medium-gray);"><b>รุ่น/โมเดล:</b> ${product.model}</p>
                    
                    ${tagsHTML}

                    <div class="price" style="font-size:2rem; margin:20px 0;"><span>฿</span> ${Number(product.price).toLocaleString()}</div>
                    
                    <div style="border-top:1px solid #ddd; padding-top:20px;">
                        <h3>ข้อมูลสเปกสินค้าเชิงลึก:</h3>
                        <p class="detail-desc">${product.detail}</p>
                    </div>

                    ${docButtonHTML}

                    <a href="https://line.me/ti/p/@yourid" target="_blank" class="btn-inquire" style="display:block; margin-top:15px; padding:15px; font-size:1.1rem; font-weight:600; text-align:center;">
                        <i class="fa-brands fa-line"></i> ติดต่อสั่งซื้อ / ขอใบเสนอราคา
                    </a>
                </div>
            </div>
        `;

    } catch (error) {
        console.error(error);
        detailContainer.innerHTML = "<p style='color:red;'>เกิดข้อผิดพลาดในการดึงรายละเอียดข้อมูล</p>";
    }
}
