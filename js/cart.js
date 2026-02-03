const Cart = {
    items: JSON.parse(localStorage.getItem('sun-cart')) || [],

    init() {
        this.updateUI();
        this.setupListeners();
    },

    add(product) {
        this.items.push(product);
        this.save();
        this.updateUI();
        this.notify(`Added ${product.name} to cart`);
    },

    remove(index) {
        this.items.splice(index, 1);
        this.save();
        this.updateUI();
    },

    save() {
        localStorage.setItem('sun-cart', JSON.stringify(this.items));
    },

    getTotal() {
        return this.items.reduce((sum, item) => sum + item.price, 0);
    },

    updateUI() {
        const countEls = document.querySelectorAll('.cart-count');
        countEls.forEach(el => el.innerText = this.items.length);

        const totalEls = document.querySelectorAll('.cart-total');
        totalEls.forEach(el => el.innerText = `$${this.getTotal().toLocaleString()}`);

        const listEls = document.querySelectorAll('.cart-list');
        listEls.forEach(el => {
            if (this.items.length === 0) {
                el.innerHTML = '<p class="empty-msg">Your cart is empty</p>';
            } else {
                el.innerHTML = this.items.map((item, i) => {
                    const qty = item.quantity || 1;
                    const details = item.customization && Object.keys(item.customization).length
                        ? Object.entries(item.customization).map(([key, val]) => `${key}: ${val}`).join(' · ')
                        : '';
                    const image = item.image || 'assets/favicon.svg';
                    return `
                    <div class="cart-item">
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <img src="${image}" alt="${item.name}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 10px; border: 1px solid var(--border-color);">
                            <div class="item-info">
                                <h4>${item.name}</h4>
                                ${details ? `<small style="display: block; color: var(--text-secondary); font-size: 0.7rem; margin-top: 0.25rem;">${details}</small>` : ''}
                                <small style="display: block; color: var(--text-secondary); font-size: 0.7rem; margin-top: 0.35rem;">Qty ${qty}</small>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span>$${item.price.toLocaleString()}</span>
                            <button onclick="Cart.remove(${i})" class="remove-btn"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `;
                }).join('');
            }
        });
    },

    setupListeners() {
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                const product = {
                    id: btn.dataset.id,
                    name: btn.dataset.name,
                    price: parseInt(btn.dataset.price),
                    image: btn.dataset.image
                };
                this.add(product);
            });
        });
    },

    notify(msg) {
        const toast = document.createElement('div');
        toast.className = 'cart-toast';
        toast.innerText = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    async checkout(formData) {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!token) {
            alert('Please log in to place your order.');
            window.location.href = 'login.html?redirect=' + encodeURIComponent('checkout.html');
            return;
        }

        try {
            // 1. Clear Backend Cart
            await fetch('http://localhost:3000/api/cart', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // 2. Sync Items
            for (const item of this.items) {
                // Only sync valid ObjectIds (skip demo/bespoke IDs if they aren't real)
                // In real app, Bespoke would be a real product ID
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(item.id);
                if (isObjectId) {
                     await fetch('http://localhost:3000/api/cart/items', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                         body: JSON.stringify({ 
                             productId: item.id,
                             quantity: 1,
                             customization: item.customization || {}
                         })
                     });
                }
            }
            
            // 3. Create Order
            const shippingAddress = {
                firstName: formData.get('firstName') || 'Guest',
                lastName: formData.get('lastName') || 'Customer',
                email: formData.get('email') || 'guest@sundial.com',
                phone: formData.get('phone') || '0000000000',
                address: formData.get('address') || '123 Luxury Lane',
                city: formData.get('city') || 'New York',
                state: formData.get('state') || 'NY',
                zipCode: formData.get('zipCode') || '10001',
                country: formData.get('country') || 'US'
            };

            const res = await fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    shippingAddress,
                    paymentMethod: 'credit-card',
                    billingAddress: shippingAddress
                })
            });
            
            const data = await res.json();
            if (data.status === 'success') {
                const orderId = data.data.order._id;
                const confirmRes = await fetch(`http://localhost:3000/api/orders/${orderId}/confirm-payment`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const confirmData = await confirmRes.json();
                if (confirmData.status !== 'success') {
                    throw new Error(confirmData.message || 'Payment confirmation failed');
                }
                localStorage.removeItem('sun-cart');
                this.items = [];
                this.updateUI();
                localStorage.setItem('last-order-id', orderId);
                window.location.href = `receipt.html?id=${orderId}`;
            } else {
                throw new Error(data.message || 'Order creation failed');
            }
            
        } catch (err) {
            console.error(err);
            alert('Checkout failed: ' + err.message);
        }
    }
};

Cart.init();
