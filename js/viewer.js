export class WatchViewer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Viewer container not found');
            return;
        }
        this.options = options;
        this.isDragging = false;
        this.startX = 0;
        this.currentFrame = 0;
        this.images = [];
        this.sensitivity = 10; // Pixels per frame
        
        this.init();
    }

    init() {
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
        this.container.style.cursor = 'grab';
        this.container.style.userSelect = 'none';
        
        // Image element
        this.imgElement = document.createElement('img');
        this.imgElement.style.width = '100%';
        this.imgElement.style.height = '100%';
        this.imgElement.style.objectFit = 'contain';
        this.imgElement.draggable = false;
        this.container.appendChild(this.imgElement);
        
        // Overlay instructions
        const overlay = document.createElement('div');
        overlay.innerText = 'Drag to Rotate 360°';
        overlay.style.position = 'absolute';
        overlay.style.bottom = '10px';
        overlay.style.left = '50%';
        overlay.style.transform = 'translateX(-50%)';
        overlay.style.color = 'var(--text-secondary)';
        overlay.style.fontSize = '0.8rem';
        overlay.style.pointerEvents = 'none';
        overlay.style.textTransform = 'uppercase';
        overlay.style.letterSpacing = '2px';
        this.container.appendChild(overlay);

        // Events
        this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        // Touch events
        this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
        window.addEventListener('touchmove', this.onTouchMove.bind(this));
        window.addEventListener('touchend', this.onMouseUp.bind(this));
    }

    loadImages(imageUrls) {
        if (!imageUrls || imageUrls.length === 0) return;
        
        this.images = imageUrls;
        this.currentFrame = 0;
        this.updateImage();
        
        // Preload
        imageUrls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    updateImage() {
        if (this.images.length > 0) {
            this.imgElement.src = this.images[this.currentFrame];
        }
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.startX = e.clientX;
        this.container.style.cursor = 'grabbing';
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        const delta = e.clientX - this.startX;
        if (Math.abs(delta) > this.sensitivity) {
            const direction = delta > 0 ? -1 : 1;
            // Proper modulo for negative numbers
            this.currentFrame = (this.currentFrame + direction + this.images.length) % this.images.length;
            this.updateImage();
            this.startX = e.clientX;
        }
    }

    onMouseUp() {
        this.isDragging = false;
        this.container.style.cursor = 'grab';
    }
    
    onTouchStart(e) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX;
    }
    
    onTouchMove(e) {
        if (!this.isDragging) return;
        // e.preventDefault(); // Might block scrolling
        const delta = e.touches[0].clientX - this.startX;
        if (Math.abs(delta) > this.sensitivity) {
            const direction = delta > 0 ? -1 : 1;
            this.currentFrame = (this.currentFrame + direction + this.images.length) % this.images.length;
            this.updateImage();
            this.startX = e.touches[0].clientX;
        }
    }
}
