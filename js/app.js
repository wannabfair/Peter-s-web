// ฟังก์ชันโหลด Header และ Footer ส่วนกลาง
document.addEventListener("DOMContentLoaded", () => {
    // 1. โหลด Header
    const headerElem = document.getElementById("main-header");
    if (headerElem) {
        fetch("header.html")
            .then(res => res.text())
            .then(data => {
                headerElem.innerHTML = data;
                initMobileMenu(); // เปิดระบบแฮมเบอร์เกอร์หลังจากโหลดเสร็จ
                highlightActiveMenu(); // ไฮไลต์เมนูหน้าปัจจุบัน
            });
    }

    // 2. โหลด Footer
    const footerElem = document.getElementById("main-footer");
    if (footerElem) {
        fetch("footer.html")
            .then(res => res.text())
            .then(data => {
                footerElem.innerHTML = data;
            });
    }
	
	// 2. เช็คตัวชี้เป้าของหน้าแรก
    const homeContainer = document.getElementById("home-product-list");
    // 3. เช็คตัวชี้เป้าของหน้าสินค้าทั้งหมด
    const allProductContainer = document.getElementById("product-list");
    
    if (homeContainer) {
        // ถ้าเจอไอดีหน้าแรก บังคับรันฟังก์ชันแสดงแค่ 6 ชิ้นเท่านั้น!
        initHomePage(homeContainer);
    } else if (allProductContainer) {
        // ถ้าเจอไอดีหน้าสินค้าทั้งหมด ค่อยรันฟังก์ชันแบ่งหน้าละ 9 ชิ้น
        initProductsPage(allProductContainer);
    }
});

// ระบบควบคุมเมนูแฮมเบอร์เกอร์ในมือถือ
function initMobileMenu() {
    const menuIcon = document.getElementById("menu-icon");
    const navMenu = document.getElementById("nav-menu");

    if (menuIcon && navMenu) {
        menuIcon.addEventListener("click", () => {
            navMenu.classList.toggle("active");
            menuIcon.classList.toggle("open");
        });
    }
}

// ระบบไฮไลต์เมนูตามหน้าปัจจุบันอัตโนมัติ
function highlightActiveMenu() {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    
    // เคลียร์คลาส active เก่าออกก่อน
    document.querySelectorAll("nav ul li a").forEach(a => a.classList.remove("active"));
    
    // ตรวจสอบชื่อไฟล์และเติมคลาส active ให้ถูกหน้า
    if (page === "index.html" || page === "") {
        const item = document.getElementById("nav-index");
        if(item) item.classList.add("active");
    } else if (page === "products.html") {
        const item = document.getElementById("nav-products");
        if(item) item.classList.add("active");
    } else if (page === "services.html") {
        const item = document.getElementById("nav-services");
        if(item) item.classList.add("active");
    } else if (page === "about.html" || page === "product-detail.html") {
        // ให้หน้ารายละเอียดสินค้าไฮไลต์ที่เมนูสินค้าด้วย
        const item = page === "product-detail.html" ? document.getElementById("nav-products") : document.getElementById("nav-about");
        if(item) item.classList.add("active");
    }
}

// โค้ดเชื่อมต่อ Google Apps Script Web App ของคุณ
const API_URL = "https://script.google.com/macros/s/AKfycbyFu_K3hntib05QfClrE_DiJWxbz8-4u1Mex1vi7he-9DrSU6G0HtPBgYswveeVpHCE/exec"; 

let allProducts = []; // เก็บตัวแปร Global ไว้กรองข้อมูล

// ตัวแปรส่วนกลางสำหรับจัดการหน้าสินค้า (products.html)
let currentPage = 1;
const itemsPerPage = 9;
let filteredProducts = []; // เก็บรายการสินค้าที่กรองตามหมวดหมู่แล้ว

document.addEventListener("DOMContentLoaded", () => {
    const productContainer = document.getElementById("product-list");
    if (productContainer) {
        initProductsPage(productContainer);
    }
});

async function initHomePage(container) {
    try {
        const response = await fetch(API_URL);
        const products = await response.json();
        
        if (products.length === 0) {
            container.innerHTML = "<p>ไม่พบสินค้าแนะนำ</p>";
            return;
        }

        // เรียงลำดับจากท้ายสุด (ล่าสุด) และตัดเอาแค่ 6 ชิ้นแรก
        const latestProducts = products.reverse().slice(0, 6);
        
        displayProducts(latestProducts, container);
		
	} catch (error) {
        console.error(error);
        container.innerHTML = "<p style='color:red;'>โหลดข้อมูลล้มเหลว</p>";
    }
}

// --- LOGIC สำหรับหน้า PRODUCTS.HTML (แสดงรายการทั้งหมดและกรองหมวดหมู่) ---
async function initProductsPage(container) {
    try {
        const response = await fetch(API_URL);
        allProducts = await response.json();
        
        if (allProducts.length === 0) {
            container.innerHTML = "<p>ไม่พบสินค้าในระบบ</p>";
            return;
        }

        // เริ่มต้นให้สินค้าที่กรองแล้วมีค่าเท่ากับสินค้าทั้งหมด (เรียงล่าสุดขึ้นก่อน)
        filteredProducts = allProducts.reverse();

        buildCategoryMenu();
        
        // แสดงสินค้าหน้าแรก (9 ชิ้นแรก) และสร้างปุ่มเปลี่ยนหน้า
        currentPage = 1;
        displayPaginatedProducts(container);

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p style='color:red;'>โหลดข้อมูลล้มเหลว</p>";
    }
}

// แก้ไขฟังก์ชันตอนกดเปลี่ยนหมวดหมู่สินค้า
function buildCategoryMenu() {
    const menuContainer = document.getElementById("category-menu");
    if (!menuContainer) return;

    const categories = ["ทั้งหมด", ...new Set(allProducts.map(p => p.category).filter(Boolean))];

    menuContainer.innerHTML = "";
    categories.forEach((cat, idx) => {
        const btn = document.createElement("button");
        btn.className = `category-btn ${idx === 0 ? 'active' : ''}`;
        btn.innerText = cat;
        btn.onclick = () => {
            document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // กรองข้อมูลและเซ็ตกลับไปหน้า 1 เสมอ
            filteredProducts = cat === "ทั้งหมด" ? allProducts : allProducts.filter(p => p.category === cat);
            currentPage = 1; 
            
            displayPaginatedProducts(document.getElementById("product-list"));
        };
        menuContainer.appendChild(btn);
    });
}

function displayProducts(productsList, container) {
    container.innerHTML = "";
    
    productsList.forEach((product, index) => {
        const card = document.createElement("div");
        card.className = "product-card";
        
        // ตรวจสอบว่ามีข้อมูล Path ไหม ถ้าไม่มีให้ใช้รูป Default ในโฟลเดอร์ images
        const mainImg = (product.image_url1 && product.image_url1.trim() !== "") 
                        ? product.image_url1.trim() 
                        : 'images/no-image.jpg';

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
			if (product[`image_url${i}`] && product[`image_url${i}`].trim() !== "") {
				images.push(product[`image_url${i}`].trim());
			}
		}
		// ถ้าใน Sheet ไม่ได้กรอก Path รูปมาเลย ให้ดึงรูป Default
		if (images.length === 0) {
			images.push('images/no-image.jpg');
		}

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

		// --- เพิ่มเติม: ตรวจสอบข้อมูลเอกสาร Documentation ---
        let docButtonHTML = "";
	// เช็คว่าในคอลัมน์มีการกรอก Path ของไฟล์ไว้จริงและไม่เป็นช่องว่าง
	if (product.documentation_url && product.documentation_url.trim() !== "") {
		docButtonHTML = `
			<a href="${product.documentation_url.trim()}" target="_blank" class="btn-download">
				<i class="fa-solid fa-file-pdf"></i> ดาวน์โหลดคู่มือ / Datasheet (PDF)
			</a>
		`;
	}
		
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

					${docButtonHTML}
					
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

// ฟังก์ชันสำหรับคำนวณแบ่งหน้าและแสดงผลทีละ 9 ชิ้น
function displayPaginatedProducts(container) {
    // 1. คำนวณจุดเริ่มต้นและจุดสิ้นสุดของข้อมูลในหน้านั้นๆ
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredProducts.slice(startIndex, endIndex);

    // 2. ส่งข้อมูลที่ตัดแล้วไปวาดเป็นการ์ดสินค้า
    displayProducts(paginatedItems, container);

    // 3. สร้างปุ่มเลขหน้าด้านล่างสินค้า
    buildPaginationControls();
}

// ฟังก์ชันสร้างแถบปุ่มเปลี่ยนหน้า [ก่อนหน้า] [1] [2] [ถัดไป]
function buildPaginationControls() {
    // ลบแถบเก่าออกก่อนถ้ามี
    let pagContainer = document.getElementById("pagination-controls");
    if (!pagContainer) {
        pagContainer = document.createElement("div");
        pagContainer.id = "pagination-controls";
        pagContainer.className = "pagination-container";
        // นำไปต่อท้ายกล่องสินค้าแนะนำในหน้าสินค้า
        document.getElementById("product-list").after(pagContainer);
    }

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    pagContainer.innerHTML = "";

    if (totalPages <= 1) {
        pagContainer.style.display = "none"; // ถ้าสินค้ามีไม่ถึง 9 ชิ้น ไม่ต้องโชว์ปุ่มเปลี่ยนหน้า
        return;
    } else {
        pagContainer.style.display = "flex";
    }

    // ปุ่มย้อนกลับ (Prev)
    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = "&laquo; ก่อนหน้า";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            displayPaginatedProducts(document.getElementById("product-list"));
            window.scrollTo({top: 0, behavior: 'smooth'}); // เลื่อนจอขึ้นบนแบบนุ่มนวล
        }
    };
    pagContainer.appendChild(prevBtn);

    // สร้างปุ่มตัวเลขหน้าตามจำนวนหน้าจริง
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement("button");
        pageBtn.innerText = i;
        if (i === currentPage) pageBtn.className = "active";
        pageBtn.onclick = () => {
            currentPage = i;
            displayPaginatedProducts(document.getElementById("product-list"));
            window.scrollTo({top: 0, behavior: 'smooth'});
        };
        pagContainer.appendChild(pageBtn);
    }

    // ปุ่มไปต่อ (Next)
    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "ถัดไป &raquo;";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayPaginatedProducts(document.getElementById("product-list"));
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    };
    pagContainer.appendChild(nextBtn);
}