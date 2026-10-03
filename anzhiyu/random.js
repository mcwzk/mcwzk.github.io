var posts=["/wz/mc/","/wz/BreweryX/","/wz/游戏版本更新1.21.11/","/wz/tp/","/wz/gG/","/wz/gy/","/wz/mcyxb/","/wz/yinfuhe/","/wz/mssd/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };