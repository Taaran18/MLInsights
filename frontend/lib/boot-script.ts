export const PREFERENCES_KEY = "mli:prefs";

export const BOOT_SCRIPT = `(function(){var d=document.documentElement;d.setAttribute("data-js","");try{var p=JSON.parse(localStorage.getItem("${PREFERENCES_KEY}")||"{}");var t=p.theme==="light"?"light":"dark";d.setAttribute("data-theme",t);if(p.sidebarPinned===true)d.setAttribute("data-sidebar","pinned");if(p.reduceMotion===true)d.setAttribute("data-motion","reduce");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?"#000000":"#ffffff")}catch(e){}})();`;
