let buttons = document.querySelectorAll('.btn-danger');
buttons.forEach(button => {
    button.onclick = (event) => confirm(`You are about to delete ${button.value}, do you want to proceed?`);
})

// if(document.location.pathname.startsWith("/admin/collection")) {
//     previews();
// }

// function previews() {
//     var imgArray = [];
//     var files = event.target.files
//     console.log(`files:${files}`)
//     console.log(`files.length:${files.length}`)
//     frame2.src = URL.createObjectURL(files[files.length - 1])
//     console.log(`frame2.src:${frame2.src}`)
// }

// https://codepen.io/mrtokachh/pen/LYGvPBj
// jQuery(document).ready(function() {
//     ImgUpload();
// })

// function ImgUpload() {
//     var imgWrap = "";
//     var imgArray = [];

//     $('.upload_inputfile').each(function() {
//         $(this).on('change', function(e) {
//             imgWrap = $(this).closest('.upload_box').find('.upload_img-wrap');
//             var maxLength = $(this).attr('data-max_length');
//             var files = e.target.files;
//             var filesArr = Array.prototype.slice.call(files);
//             var iterator = 0;
//             filesArr.forEach(function(f,index) {
//                 if(!f.type.match('image.*')) {
//                     return;
//                 }

//                 if(imgArray.length > maxLength) {
//                     return false
//                 } else {
//                     var len = 0;
//                     for (var i = 0; i < imgArray.length; i++) {
//                         if(imgArray[i] !== undefined) {
//                             len++;
//                         }
//                     }
//                     if (len > maxLength) {
//                         return false;
//                     } else {
//                         imgArray.push(f);
//                         var reader = new FileReader();
//                         reader.onload = function(e) {
//                             var html = "<div class='upload__img-box'><div style='background-image: url(" + e.target.result + ")' data-number='" + $(".upload__img-close").length + "' data-file='" + f.name + "' class='img-bg'><div class='upload__img-close'></div></div></div>";
//                             imgWrap.append(html);
//                             iterator++;
//                         }
//                         reader.readAsDataURL(f);
//                     }
//                 }
//             })
//         })
//     })
// }