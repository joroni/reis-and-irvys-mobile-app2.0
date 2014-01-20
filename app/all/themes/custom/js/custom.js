/**
 * @file
 * A JavaScript file for the theme.
 */
 
(function ($, Drupal, window, document, undefined) {
Drupal.behaviors.mainMenuToggle = {
    attach: function(context, settings) {           
                     //Toggle menu for mobile devices
  $('.region-menu .navigation').before('<a href="#" class="menu-toggle" title="Toggle Menu"><span class="line"></span><span class="line"></span><span class="line"></span></a>');
       
      $('.region-menu .menu-toggle').click(function(){
        $('#menu-navigation').slideToggle();
      });
      var menuid = "#region-menu";                       
             //Simple hide/show event for the dropdown menus
             $(menuid+' li').hover(
                 function(){
                 $('ul:first', $(this)).show();
                 },
                 function(){
                 $('ul', $(this)).slideUp();
                 }
              );      
    }
     
     
  };
 
})(jQuery, Drupal, this, this.document);
