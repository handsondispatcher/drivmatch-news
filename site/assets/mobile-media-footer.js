/* DrivMatch News: use the SAME media/advertising sidebar in both layouts.
   Desktop: right column. Mobile/tablet <=990px: last content before footer.
   No cloned embeds, ad counters, IDs, or duplicate advertising inventory.
*/
(()=>{'use strict';
 const rail=document.getElementById('mercados');
 const desktopGrid=document.querySelector('.main');
 const news=desktopGrid?.querySelector(':scope > main');
 const mobileSlot=document.getElementById('mobile-media-footer-slot');
 if(!rail||!desktopGrid||!news||!mobileSlot)return;
 const mobile=window.matchMedia('(max-width: 990px)');
 function layout(){
  if(mobile.matches){
   if(rail.parentElement!==mobileSlot)mobileSlot.appendChild(rail);
   rail.dataset.layoutPlacement='mobile-footer';
  }else{
   if(rail.parentElement!==desktopGrid||rail.previousElementSibling!==news){
    news.insertAdjacentElement('afterend',rail);
   }
   rail.dataset.layoutPlacement='desktop-right';
  }
 }
 layout();
 if(mobile.addEventListener)mobile.addEventListener('change',layout);
 else mobile.addListener?.(layout);
})();
