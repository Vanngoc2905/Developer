document.addEventListener("DOMContentLoaded", () => {
    // Lấy các phần tử DOM
    const navbar = document.querySelector(".navbar");
    const searchForm = document.querySelector(".search-form");
    const cartItem = document.querySelector(".cart-items-container");
    const menuBtn = document.querySelector("#menu-btn");
    const searchBtn = document.querySelector("#search-btn");
    const cartBtn = document.querySelector("#cart-btn");

    // Tạo hàm để đóng mở các phần tử menu, tìm kiếm, giỏ hàng
    const toggleClass = (element, className, exclude = []) => {
        if (element) {
            element.classList.toggle(className);
            exclude.forEach(ex => ex.classList.remove(className));
        }
    };

    // Gắn sự kiện cho các nút menu, tìm kiếm, giỏ hàng
    if (menuBtn) {
        menuBtn.addEventListener("click", () => {
            toggleClass(navbar, "active", [searchForm, cartItem]);
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener("click", () => {
            toggleClass(searchForm, "active", [navbar, cartItem]);
        });
    }

    if (cartBtn) {
        cartBtn.addEventListener("click", () => {
            toggleClass(cartItem, "active", [navbar, searchForm]);
        });
    }

    // Đóng tất cả khi cuộn trang
    window.addEventListener("scroll", () => {
        [navbar, searchForm, cartItem].forEach(el => el.classList.remove("active"));
    });

    // Đóng các phần tử khi nhấp ngoài
    document.addEventListener("click", event => {
        const target = event.target;
        if (!navbar.contains(target) && target !== menuBtn) navbar.classList.remove("active");
        if (!searchForm.contains(target) && target !== searchBtn) searchForm.classList.remove("active");
        if (!cartItem.contains(target) && target !== cartBtn && !target.closest('.cart-item')) cartItem.classList.remove("active");
    });

    // Tải tóm tắt giỏ hàng
    const loadCartSummary = () => {
        $.ajax({
            url: '/ShoppingCart/GetCartSummary',
            type: 'GET',
            success: response => {
                $('#cart-item-count').text(response.CartItemCount);
                $('#total-price').text(response.TotalPrice.toLocaleString('vi-VN') + ' VNĐ');
                const cartItemsHtml = response.CartItems.length > 0
                    ? response.CartItems.map(item => `
                        <div class="cart-item d-flex align-items-center p-2 cart-item-row" data-product-id="${item.ProductId}">
                            <img src="${item.ImageUrl}" class="cart-img" alt="${item.Name}">
                            <div class="cart-info ms-2">
                                <h6 class="cart-title">${item.Name}</h6>
                                <p class="cart-price text-danger">${item.Price.toLocaleString('vi-VN')} VNĐ</p>
                                <p class="cart-qty">
                                    <button class="btn btn-sm btn-outline-secondary decrease">-</button>
                                    <input type="text" class="quantity-display" value="${item.Quantity}" readonly>
                                    <button class="btn btn-sm btn-outline-secondary increase">+</button>
                                </p>
                            </div>
                            <span class="cart-item-total">${(item.Price * item.Quantity).toLocaleString('vi-VN')} VNĐ</span>
                            <button class="btn btn-sm btn-danger remove-item ms-auto" data-product-id="${item.ProductId}">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    `).join('')
                    : '<p class="text-center text-muted">Giỏ hàng trống</p>';
                $('#cart-items-list').html(cartItemsHtml);
            },
            error: () => console.error('Error loading cart summary'),
        });
    };

    // Cập nhật số lượng sản phẩm trong giỏ
    function updateQuantity(row, productId, change) {
        const quantityInput = row.querySelector(".quantity-display");
        const currentQuantity = parseInt(quantityInput.value);

        if (currentQuantity + change < 1) return;

        const newQuantity = currentQuantity + change;
        quantityInput.value = newQuantity;

        // Cập nhật lại tổng tiền
        updateTotalPrice();

        // Gửi yêu cầu cập nhật số lượng lên server
        sendUpdateToServer(productId, newQuantity);
    }

    // Gửi yêu cầu cập nhật số lượng sản phẩm lên server
    const sendUpdateToServer = (productId, newQuantity) => {
        fetch('/ShoppingCart/AdjustQuantity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, newQuantity }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    $('#cart-item-count').text(data.cartItemCount);
                    $('#total-price').text(data.totalPrice.toLocaleString("vi-VN") + " VNĐ");
                }
            })
            .catch(error => console.error("Lỗi cập nhật:", error));
    };

    // Cập nhật lại tổng tiền giỏ hàng
    const updateTotalPrice = () => {
        const totalPriceElement = document.querySelector('#total-price');
        let total = 0;

        // Tính tổng tiền dựa trên số lượng và giá sản phẩm
        document.querySelectorAll('.cart-item-row').forEach(row => {
            const price = parseInt(row.querySelector(".cart-price").textContent.replace(/[^\d]/g, ""));
            const quantity = parseInt(row.querySelector(".quantity-display").value);
            total += price * quantity;
        });

        totalPriceElement.textContent = total.toLocaleString("vi-VN") + " VNĐ";
    };

    // Xử lý các sự kiện trong giỏ hàng (tăng giảm số lượng, xóa sản phẩm)
    document.body.addEventListener("click", (event) => {
        const button = event.target;
        const row = button.closest(".cart-item-row");
        if (!row) return;

        const productId = row.getAttribute("data-product-id");

        if (button.classList.contains("increase")) {
            updateQuantity(row, productId, 1);
        } else if (button.classList.contains("decrease")) {
            updateQuantity(row, productId, -1);
        } else if (button.classList.contains("remove-item")) {
            removeFromCart(productId);
        }
    });

    // Xóa sản phẩm khỏi giỏ hàng
    const removeFromCart = (productId) => {
        fetch("/ShoppingCart/RemoveFromCart", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "RequestVerificationToken": document.querySelector('input[name="__RequestVerificationToken"]')?.value || ""
            },
            body: JSON.stringify({ productId })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: "success",
                        title: "Đã xóa!",
                        text: data.message,
                        timer: 1000,
                        showConfirmButton: false
                    }).then(() => {
                        document.querySelector(`[data-product-id="${productId}"]`)?.remove();
                        loadCartSummary();
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Lỗi!",
                        text: data.message
                    });
                }
            })
            .catch(err => {
                console.error("Lỗi xóa sản phẩm:", err);
                Swal.fire({
                    icon: "error",
                    title: "Lỗi!",
                    text: "Không thể xóa sản phẩm khỏi giỏ."
                });
            });
    };

    // Khởi tạo giỏ hàng khi trang được tải
    loadCartSummary();
});
