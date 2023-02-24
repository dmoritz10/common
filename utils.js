
var confirm = function (msg) {

  return new Promise(resolve => {

    bootbox.confirm({

      closeButton: false,
      // size: "small",
      message: '<h5>' + msg + '</h5>',
      centerVertical: true,


      callback: function (result) { /* result is a boolean; true = OK, false = Cancel*/

        if (result) {

          resolve(true)

        } else {

          resolve(false)

        }
      }
    });
  });
}

var prompt = function (title, inputType) {

  return new Promise(resolve => {

    bootbox.prompt({

      closeButton: false,
      backdrop: true,
      title: '<h5>' + title + '</h5>',
      centerVertical: true,
      inputType: inputType,


      callback: function (result) { /* result is a boolean; true = OK, false = Cancel*/

          resolve(result)

      }
    });
  });
}

function toast(e, delay = 5000) {

  $("#toast-content").html(e)

  $("#myToast").toast({delay: delay});

  $("#myToast").toast('show');

}

function calcRngA1(r, col, nbrRows, nbrCols) {

  const n2c = n => {
    // Column number to 26 radix. From 0 to p.
    // Column number starts from 1. Subtract 1.
    return [...(n-1).toString(26)]
      // to ascii number
      .map(c=>c.charCodeAt())
      // Subtract 1 except last digit.
      // Look at 10. This should be AA not BA.
      .map((c,i,arr)=>i<arr.length-1?c-1:c)
      // Convert with the ascii table. [0-9]->[A-J] and [a-p]->[K-Z]
      .map(a=>a>96?a-22:a+17)
      // to char
      .map(a=>String.fromCharCode(a))
      .join('');
  };

  var rngA1 = n2c(col) + r + ':' + n2c(col + nbrCols - 1) + (r + nbrRows - 1)

  return rngA1

}

function toObject(arr) {
  var rv = { };
  for (var i = 0; i < arr.length; ++i)
  if (arr[i] !== undefined) rv[arr[i][0]] = arr[i][1];
  return rv;
}

function toObjectIdx(arr) {
  var rv = { };
  for (var i = 0; i < arr.length; ++i)
  if (arr[i] !== undefined) rv[arr[i][0]] = i;
  return rv;
}

function makeObj(courseInfo, cols) {

  var rtnObj = { }
  for (var i = 0; i < courseInfo.length; ++i)
  if (courseInfo[i] !== undefined) rtnObj[cols[i]] = courseInfo[i];

  return rtnObj;

}

function formatDate(d) {

  return (d.getMonth()+1)+'/'+ d.getDate()+'/'+d.getFullYear()

}

function formattime(dte){

   if (isNaN(Date.parse(dte))) return


  var zero = '0', hours, minutes, seconds, time;
  time = new Date(dte);

  var hh = (zero + time.getHours()).slice( - 2);
  var mm = (zero + time.getMinutes()).slice( - 2);
  var ss = (zero + time.getSeconds()).slice( - 2);
  return hh +':' + mm +':' + ss;
}

function msToHHMMSS(ms) {

  ms = Math.abs(ms)

  let seconds = Math.floor((ms / 1000) % 60);
  let minutes = Math.floor((ms / 1000 / 60) % 60);
  let hours = Math.floor((ms / 1000 / 3600) % 24)

  if (hours) hours = (hours < 10) ? "0" + hours : hours
  else hours = false
  if (hours) minutes = (minutes < 10) ? "0" + minutes : minutes
  else minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  var hhmmss = []

  if (hours) hhmmss.push(hours)
  hhmmss.push(minutes)
  hhmmss.push(seconds)

  return hhmmss.join(':');

}

function parseDateISOString(s) {
  let ds = s.split(/\D/).map(s => parseInt(s));
  ds[1] = ds[1] - 1; // adjust month
  return new Date(...ds);
}

function formatNumber (str) { 

    if (!str) {return}
  var x = str.toString().split('.');
  var x1 = x[0]; 
    var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2'); 
    }
  return x1 + x2; 

};

function promiseRun (func) {

// this is a trick to convert the arguments array into an array, and drop the first one
  var runArgs = Array.prototype.slice.call(arguments).slice(1);

  return new Promise (function (resolve, reject) {

    google.script.run
      .withSuccessHandler(function (result) {
        resolve(result);
      })
      .withFailureHandler(function (error) {
        reject(error);
      })

    [func].apply(this, runArgs) ;
        
  })
}

function gotoTab(tabName) {

  var $tab = $('#' + tabName )

  $( '.tab-content > div.active' ).removeClass( 'active show' );
  
  $tab.addClass( 'active show' );

}

function setupFormValidation() {

    $.validator.setDefaults({
      highlight: function (element) {
        $(element).parent().addClass('text-danger');
      },
      unhighlight: function (element) {
        $(element).parent().removeClass('text-danger');
      },
      errorElement: 'bold',
      errorClass: 'form-control-feedback d-block',
      errorPlacement: function (error, element) {
        if (element.parent('.input-group').length) {
          error.insertAfter(element.parent());
        } else if (element.prop('type') === 'checkbox') {
          error.appendTo(element.parent().parent().parent());
        } else if (element.prop('type') === 'radio') {
          error.appendTo(element.parent().parent().parent());
        } else {
          error.insertAfter(element);
        }
      },
    });

 
  $("#sheet-form").validate();
 
}

function validateUrl(value) {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

function is2dArray(array){

  if(array[0] === undefined){
    return false;
  } else {
    return (array[0].constructor === Array);
  }
}

function modal(state) {
  if (state) {
    $("#overlay").fadeIn("slow");;

    // $("#overlay").css({"display":"block"});
  } else {
    $("#overlay").fadeOut("slow");;
  }
}