export function openPage(pageName) {
    var i;
    var x = document.getElementsByClassName("page");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    document.getElementById(pageName).style.display = "";
}

export function w3_open() {
    document.getElementById("mySidebar").style.display = "block";
}

export function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.expando').forEach(function(el) {
        el.addEventListener('click', function() {
            var next = this.nextElementSibling;
            if (next) {
                next.style.display = next.style.display === 'none' ? '' : 'none';
            }
        });
    });

    var scrollTop = document.getElementById('scroll-to-top');
    if (scrollTop) {
        scrollTop.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return false;
        });
    }
});
