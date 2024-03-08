$(document).ready(function(){
    var sectionArray = [1, 2, 3, 4, 5];

    // Add click event listener to all nav links
    $('.navbar-nav .nav-item .nav-link').click(function() {
        // Remove 'active' class from all nav links
        $('.navbar-nav .nav-item .nav-link').removeClass('active');
        // Add 'active' class to the clicked nav link
        $(this).addClass('active');
    });

    // Scroll event listener
    $(document).scroll(function(){
        var docScroll = $(document).scrollTop();
        $.each(sectionArray, function(index, value){
            var offsetSection = $('#' + 'section_' + value).offset();
            if (offsetSection) {
                offsetSection = offsetSection.top - 90;
                if (docScroll >= offsetSection){
                    // Remove 'active' class from all nav links
                    $('.navbar-nav .nav-item .nav-link').removeClass('inactive');
                    // Add 'active' class to the corresponding nav link
                    $('.navbar-nav .nav-item .nav-link').eq(index).addClass('inactive');
                }
            }
        });
    });

    // Smooth scroll to section on click
    $('.click-scroll').click(function(e){
        var targetSectionId = $(this).attr('href');
        var offsetClick = $(targetSectionId).offset();
        if (offsetClick) {
            offsetClick = offsetClick.top - 90;
            e.preventDefault();
            $('html, body').animate({
                'scrollTop': offsetClick
            }, 300)
        }
    });
});
