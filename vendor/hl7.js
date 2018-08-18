let thisMove;
let thisRemove;

function draggableObject(ele) {
    this.element = ele;
    this.modal = ele.parentNode;
    this.lastX = 0;
    this.lastY = 0;
    this.originalStyle = this.modal.style;
    this.dragging = false;

    this.mouseRelease = function (e) {
        document.removeEventListener('mouseup', thisRemove, false);
        document.removeEventListener('mousemove', thisMove, false);
        this.dragging = false;
        if (this.modal.offsetTop < 0) {
            this.modal.style.top = 0;
        }
        if (this.modal.offsetLeft < 0) {
            this.modal.style.left = 0;
        }
    };

    this.mouseMoving = function (e) {
        let x = this.lastX - e.clientX;
        let y = this.lastY - e.clientY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.modal.style.top = this.modal.offsetTop - y + 'px';
        this.modal.style.left = this.modal.offsetLeft - x + 'px';
    };

    this.mouseDown = function (e) {
        e.preventDefault();
        if (e.button === 0 && !this.dragging) {            
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            thisMove = this.mouseMoving.bind(this);
            thisRemove = this.mouseRelease.bind(this);
            // For the dialog fixed in the center we need to remove the margin and manually set
            // the left style to allow it to move correctly
            let currentLeft = this.modal.offsetLeft;
            this.modal.style.margin = 'initial';
            this.modal.style.left = currentLeft + 'px';
            document.addEventListener('mousemove', thisMove, false);
            document.addEventListener('mouseup', thisRemove, false);
            this.dragging = true;
        } else if (this.dragging) {
            this.mouseRelease();
        }
    };

    this.makeDraggable = function () {
        ele.onmousedown = this.mouseDown.bind(this);
    };

    this.resetStyle = function () {
        this.modal.style = this.originalStyle;
    };
}

