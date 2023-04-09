const Retrier = class {
    constructor(opts = {}) {
        this.opts = {};
        this.attempt = 0;
        this.opts.limit = opts.limit || 1;
        this.opts.delay = opts.delay || 0;
        this.opts.firstAttemptDelay = opts.firstAttemptDelay || 0;
        this.opts.reAuth = opts.reAuth || [401, 403];
        this.opts.quotaExceeded = opts.quotaExceeded || [408, 429];
    }
    resolve(fn) {
        this.fn = fn;
        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
            this.attempt = 0;
            this._doRetry();
        });
    }
    _doRetry(recentError) {
        if (this.attempt >= this.opts.limit) {
            // return this._reject(recentError || new Error('Retry limit reached!'));
            return this._reject(new Error('Retry limit reached!'));
        }
        setTimeout(async () => {
  
            var promise = this.fn();
  
            if (!(promise instanceof Promise)) {
                // TODO: throw error in contructor if params aren't valid
                return this._reject(new Error('Expecting function which returns promise!'));
            }
            promise.then(response => {
                this._resolve(response);
            }).catch( async error => {
                if (this.opts.reAuth.indexOf(error.status) > -1) {
                  console.log('if', error)
                  await Goth.token()              // for authorization errors obtain an access token
                  this._doRetry(error);
                }
                else if (this.opts.quotaExceeded.indexOf(error.status) > -1) {
                  console.log('else if', error)
                  this.attempt++;
                  this._doRetry(error);
                } 
                else {
                  console.log('else', error)
                  this._reject(error)
                }
            });
        }, this.attempt === 0 ? this.opts.firstAttemptDelay : 2 ** this.attempt * this.opts.delay);
    }
  }
  

  //  database access
  
  //  Sheets
  
  function readOption(key, defaultReturn = '') { // -
  
      if (!arrOptions[key]) return defaultReturn
      if (arrOptions[key] == 'null') return defaultReturn
    
      try { var rtn = JSON.parse(arrOptions[key]) }
      catch (err) { var rtn = arrOptions[key] }
    
      return rtn
    
  }
  
  async function updateOption(key, val) { // **

    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]


    if (typeof val === "object") {
      var strVal = JSON.stringify(val)
    } else {
      var strVal = val
    }
  
    arrOptions[key] = strVal
  
    var resource = {
      "majorDimension": "ROWS",
      "values": [[
        key,
        strVal
      ]]
    }
  
    var row = optionsIdx[key] + 2
  
    var params = {
      spreadsheetId: spreadsheetId,
      range: "'Settings'!A" + row + ":B" + row,
      valueInputOption: 'RAW'
    };

    console.log('pre gapi', callerName) 
  
    const options = { limit: 5, delay: 2000};
    const retrier = new Retrier(options);
    let response = await retrier
      .resolve(async attempt => gapi.client.sheets.spreadsheets.values.update(params, resource))
      .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
      );
  
    console.log('post gapi', callerName)    
      
    return response
  
  }
  
  async function openShts(shts, ssId = spreadsheetId) { // **
  
    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]


    return new Promise(async resolve => {
  
      shtRngs = []
      
      for (s in shts) {
  
        var sheet = shts[s]
  
        switch (sheet.type) {
  
          case "headers":
            shtRngs.push("'" + sheet.title + "'!1:1")
            break;
  
          case "all"  :
            shtRngs.push("'" + sheet.title + "'!A1:ZZ100000")
            break;
  
        }
  
      }

      console.log('pre gapi', callerName)     

      const options = { limit: 5, delay: 2000};
      const retrier = new Retrier(options);
      let response = await retrier
        .resolve(async attempt => gapi.client.sheets.spreadsheets.values.batchGet({spreadsheetId: ssId, ranges: shtRngs}))
        .then(
          result => {console.log('result', result);return result},
          error =>  {console.log(error) ;return error}
        );
    
      console.log('post gapi', callerName)     
  
      var allShts = response.result.valueRanges
  
      console.log('openShts', response)
  
      var arr = []
  
      for (s in allShts) {
      
        var shtVals = allShts[s].values
  
        var colHdrs = shtVals[0]
        var vals = shtVals.slice(1)
        var rowCnt = vals ? vals.length : 0
  
        var shtTitle = allShts[s].range.split('!')[0].replace(/'/g,"")
  
        arr[shtTitle] =  {  
          colHdrs:      colHdrs,
          vals:         shtVals.slice(1),
          columnCount:  colHdrs.length,
          rowCount:     rowCnt
        }
        
      }
  
      resolve(arr)
  
    })
  
  }
  
  async function getSheetRange(rng, sht, ssId = spreadsheetId) { // **
    
    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]

    console.log('pre gapi', callerName)     

    const options = { limit: 5, delay: 2000};
    const retrier = new Retrier(options);
    let response = await retrier
      .resolve(async attempt => gapi.client.sheets.spreadsheets.values.batchGet({spreadsheetId: ssId, ranges: ["'" + sht + "'!" + rng]}))
      .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
      );
  
    console.log('post gapi',  callerName)       

    return response
  
  }
  
  async function clearSheetRange(rng, sht, ssId = spreadsheetId) { // **

    var params = {
      spreadsheetId: ssId, 
      range: "'" + sht + "'!" + rng
    };
  
    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     

    const options = { limit: 5, delay: 2000};
    const retrier = new Retrier(options);
    let response = await retrier
      .resolve(async attempt => gapi.client.sheets.spreadsheets.values.clear(params))
      .then(
        result => {console.log(result);return result},
        error =>  {console.log(error) ;return error}
      );
      
    console.log('post gapi', callerName)     
  
    return response
  
  }
  
  async function batchUpdateSheet(resource) { // *
    
    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
    
    const options = { limit: 5, delay: 2000};
    const retrier = new Retrier(options);
    let response = await retrier
    .resolve(async attempt => gapi.client.sheets.spreadsheets.values.batchUpdate({spreadsheetId: spreadsheetId, resource: resource}))
    .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
    );
    
    console.log('post gapi', callerName)      
  
    return response
  
  }
  
  async function updateSheet(title, vals) { // **
  
    var nbrRows = vals.length
    var maxRows = 5000
    var strtRow = 0
    var currRow = 0
  
    var promiseArr = []
    var resourceArr = []
    var paramsArr = []
    var i = -1
    var responseArr = []
  
    while (vals.length > 0) {
  
      strtRow = currRow
      i++
  
      var chunk = vals.splice(0, maxRows)
  
      currRow += chunk.length
  
      console.log('strtRow', strtRow)
      console.log('currRow', currRow)
      console.log('chunk', chunk)
      console.log('vals.length', vals.length)
  
  
      var resource = {
        "majorDimension": "ROWS",
        "values": chunk   
      }

      resourceArr.push(resource)
  
      var rng = calcRngA1(strtRow + 1, 1, chunk.length, chunk[0].length)
  
      var params = {
      spreadsheetId: spreadsheetId,
      range: "'" + title + "'!" + rng,
      valueInputOption: 'RAW'
      };

      paramsArr.push(params)

  
      const options = { limit: 5, delay: 2000};
      const retrier = new Retrier(options);
  
      promiseArr.push(
        new Retrier(options)
        .resolve(async attempt => gapi.client.sheets.spreadsheets.values.update(params[i], resource[i]))
        .then(
          result => {console.log(result);return result},
          error =>  {console.log(error) ;return error}
        )
      )

  
    // const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    // console.log('pre gapi', callerName)     

    // const options = { limit: 5, delay: 2000};
    // const retrier = new Retrier(options);
    // let response = await retrier
    //   .resolve(async attempt => gapi.client.sheets.spreadsheets.values.update(params, resource))
    //   .then(
    //     result => {console.log(result);return result},
    //     error =>  {console.log(error) ;return error}
    //   );
      
    // console.log('post gapi', callerName)     
  
    // responseArr.push(response)


    }

    await Promise.all(promiseArr)

    console.log('post promise.all', promiseArr)     


    // return responseArr
  
  } 
  
  async function updateSheetRow(vals, shtIdx, shtTitle, ssId = spreadsheetId) { // **
  
    var resource = {
      "majorDimension": "ROWS",
      "values": [vals]    
    }
  
    var row = shtIdx
    var rng = calcRngA1(row, 1, 1, vals.length)
  
    var params = {
      spreadsheetId: ssId,
      range: "'" + shtTitle + "'!" + rng,
      valueInputOption: 'RAW'
    };

    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
      
    const options = { limit: 5, delay: 2000};
    const retrier = new Retrier(options);
    let response = await retrier
      .resolve(async attempt => gapi.client.sheets.spreadsheets.values.update(params, resource))
      .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
      );
  
    console.log('post gapi', callerName)     
  
    return response
  
  }
  
  async function appendSheetRow(vals, shtTitle) { // **
    
    var resource = {
      "majorDimension": "ROWS",
      "values": [vals]    
    }
  
    var row = 2
    var rng = calcRngA1(row, 1, 1, vals.length)

    var params = {
    spreadsheetId: spreadsheetId,
    range: "'" + shtTitle + "'!" + rng,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS'
    };

    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
    
    const options = { limit: 5, delay: 2000};
    const retrier = new Retrier(options);
    let response = await retrier
    .resolve(async attempt => gapi.client.sheets.spreadsheets.values.append(params, resource))
    .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
    );
    
    console.log('post gapi', callerName)  
  
    return response
  
  }
  
  async function deleteSheetRow(idx, sheetName) { // **
  
    var shtId = await getSheetId(sheetName)
  
    var request = {
      "requests":
        [
          {
            "deleteDimension": {
              "range": {
                "sheetId": shtId,
                "dimension": "ROWS",
                "startIndex": idx,
                "endIndex": idx + 1
              }
            }
          }
        ]
    }
  
    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
    
    const options = { limit: 5, delay: 2000};
    const retrier = new Retrier(options);
    let response = await retrier
    .resolve(async attempt => gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId: spreadsheetId, resource: request}))
    .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
    );
    
    console.log('post gapi', callerName)  
  
    return response
  
  }
  
  async function updateSheetHdr(vals, shtTitle) { // **
  
    var resource = {
      "majorDimension": "ROWS",
      "values": [vals]    
    }
  
      var rng = calcRngA1(1, 1, 1, vals.length)
  
      var params = {
        spreadsheetId: spreadsheetId,
        range: "'" + shtTitle + "'!" + rng,
        valueInputOption: 'RAW'
      };
  
      const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
      console.log('pre gapi', callerName)     
      
      const options = { limit: 5, delay: 2000};
      const retrier = new Retrier(options);
      let response = await retrier
      .resolve(async attempt => gapi.client.sheets.spreadsheets.values.update(params, resource))
      .then(
          result => {console.log('result', result);return result},
          error =>  {console.log(error) ;return error}
      );
      
      console.log('post gapi', callerName)  
    
      return response
  
  }
  
  async function sortSheet(sortSpec, shtTitle) { // *
    
    sortSpec.requests[0].sortRange.range.sheetId = await getSheetId(shtTitle)
    console.log('sortSpec', sortSpec)

    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
    
    const options = { limit: 5, delay: 2000};
    const retrier = new Retrier(options);
    let response = await retrier
    .resolve(async attempt => gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId: spreadsheetId, resource: sortSpec}))
    .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
    );
    
    console.log('post gapi', callerName)      
  
    return response
  
  }
  
  async function renameSheet(shtId, shtTitle) { // **
    
    const rq = {"requests" : [
      {
       updateSheetProperties: {
        properties: {
         sheetId: shtId,
         title: shtTitle,
        },
        fields: 'title'
        }
       }]}
     ;
      
     const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
     console.log('pre gapi', callerName)     
     
     const options = { limit: 5, delay: 2000};
     const retrier = new Retrier(options);
     let response = await retrier
     .resolve(async attempt => gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId: spreadsheetId, resource: rq}))
     .then(
         result => {console.log('result', result);return result},
         error =>  {console.log(error) ;return error}
     );
     
     console.log('post gapi', callerName)  
   
     return response
      
  }
  
  async function copySheet(shtId) { // **
  
    var params = {
      spreadsheetId: spreadsheetId,  
      sheetId: shtId,  
    };
  
    var copySheetToAnotherSpreadsheetRequestBody = {
      destinationSpreadsheetId: spreadsheetId
    };
  
    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
    
    const options = { limit: 5, delay: 2000};
    const retrier = new Retrier(options);
    let response = await retrier
        .resolve(async attempt => gapi.client.sheets.spreadsheets.sheets.copyTo(params, copySheetToAnotherSpreadsheetRequestBody))
        .then(
            result => {console.log('result', result);return result},
            error =>  {console.log(error) ;return error}
        );
    
    console.log('post gapi', callerName)  

    return response
  
  }
  
  async function getSheets() { // **
  
    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
      
    const options = { limit: 5, delay: 2000};
    const retrier = new Retrier(options);
    let response = await retrier
      .resolve(async attempt => gapi.client.sheets.spreadsheets.get({spreadsheetId: spreadsheetId}))
      .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
      );
  
    console.log('post gapi', callerName)  

    return response

  }
  
  async function getSheetId(shtTitle) { // *

    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
    
    const options = { limit: 5, delay: 2000};
    const retrier = new Retrier(options);
    let response = await retrier
    .resolve(async attempt => gapi.client.sheets.spreadsheets.get({spreadsheetId: spreadsheetId}))
    .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
    );
    
    console.log('post gapi', callerName)  
  
    var sheets = response.result.sheets
  
    for (var j = 0; j < sheets.length; j++) {
  
      var sht = sheets[j].properties
  
      if (sht.title == shtTitle) return sht.sheetId
  
    }
  
    return null
  }
  
  var wtArr = []
  
//   async function writeThrottle(nbrWrites = 1) {
  
//     return
  
//     const maxWritesPerMin = 30
//     const delay = (ms) => new Promise(res => setTimeout(res, ms));
//     const ts = (dt) => dt.toISOString().substring(11,23)
  
//   console.log('begin', ts(new Date()))
    
//     // var wtArr = writeThrottleArr
//     var oma = new Date();
//     oma.setMinutes(oma.getMinutes() - 1);
  
//     console.log('writeThrottle', ts(oma), wtArr.map( ele => ts(ele)), wtArr.map( ele => ele - oma))
//     // console.log('oma', ts(oma), ts(wtArr[i]), wtArr[i] < oma)
  
//     for (let i=wtArr.length-1; i>=0; i--) {
//       if (wtArr[i] < oma) {console.log('remove wtArr', i, ts(wtArr[i]), ts(oma));wtArr.splice(i, 1)}
      
//     }
  
//     if (wtArr.length > maxWritesPerMin - nbrWrites - 3) {
      
//       console.log('delay', wtArr[0] - oma)
//       await delay (wtArr[0] - oma);
//       console.log('delay resume', ts(new Date()))
    
//     }
  
//     console.log('resume', ts(new Date()))
  
//     for (let i = 0;i<nbrWrites;i++) wtArr.push(new Date())
  
//     return
  
//   }
  
  
  //  Drive
  
  async function listDriveFiles(sheetName) { // **
  
    let q = "name = '" + sheetName +
                        "' AND " + "mimeType='application/vnd.google-apps.spreadsheet'" +
                        " AND " + "trashed = false"
  
    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
    
    const options = { limit: 5, delay: 2000, quotaExceeded: [429, 403]};
    const retrier = new Retrier(options);
    let response = await retrier
    .resolve(async attempt => gapi.client.drive.files.list({
                                        q: q,
                                        fields: 'nextPageToken, files(id, name, ownedByMe)',
                                        spaces: 'drive'}))
    .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
    );
    
    console.log('post gapi', callerName)  
                    
    return response
  
  }
  
  async function getSSId(sheetName) { // -
  
    var response = await listDriveFiles(sheetName)
  
    if (!response) return
  
    var files = response.result.files
  
    if (!files || files.length == 0)
        return { fileId: null, msg: "'" + sheetName + "' not found" }
  
    if (files.length > 1)
        return { fileId: null, msg: "'" + sheetName + "' not unique" }
  
    return { fileId: files[0].id, msg: 'ok' }
  
  }
  
  async function createDriveFile() { // **
  
    let resource = {                  
        name : 'Sheet',
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: ['1eAwbR_yzsEaEpBEpFA0Pqp8KGP2XszDY']
      }

    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
    
    const options = { limit: 5, delay: 2000, quotaExceeded: [429, 403]};
    const retrier = new Retrier(options);
    let response = await retrier
    .resolve(async attempt => gapi.client.drive.files.create({resource: resource}))
    .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
    );
    
    console.log('post gapi', callerName)  
    
    return response
  
  }
  
  async function deleteDriveFile(fileId) { // **
 
    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
    
    const options = { limit: 5, delay: 2000, quotaExceeded: [429, 403]};
    const retrier = new Retrier(options);
    let response = await retrier
    .resolve(async attempt => gapi.client.drive.files.delete({fileId : fileId}))
    .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
    );
    
    console.log('post gapi', callerName)  
    
    return response
  
  }
  
  async function renameDriveFile(fileId, fileName) { // **

    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
    
    const options = { limit: 5, delay: 2000, quotaExceeded: [429, 403]};
    const retrier = new Retrier(options);
    let response = await retrier
    .resolve(async attempt => gapi.client.drive.files.update({fileId : fileId, resource: { name: fileName}}))
    .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
    );
    
    console.log('post gapi', callerName)  
    
    return response
  
  }
  
  //  Calendar
  
  async function updateCalendarEvent(eventId, event) { // *
  
    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
 
    const options = { limit: 5, delay: 2000, quotaExceeded: [429, 403]};
    const retrier = new Retrier(options);
    let response = await retrier
    .resolve(async attempt => gapi.client.calendar.events.update({
                                    'calendarId': 'primary',
                                    'eventId': eventId,
                                    'resource': event}))
    .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
    );
    
    console.log('post gapi', callerName)  
                    
    return response 
  
  }
  
  async function insertCalendarEvent(event) { // *
  
    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
 
    const options = { limit: 5, delay: 2000, quotaExceeded: [429, 403]};
    const retrier = new Retrier(options);
    let response = await retrier
    .resolve(async attempt => gapi.client.calendar.events.insert({
                            'calendarId': 'primary',
                            'resource': event}))
    .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
    );
    
    console.log('post gapi', callerName)  
                    
    return response  
    
  }
  
  async function deleteCalendarEvent(eventId) { // *
  
    const callerName = new Error().stack.split(/\r\n|\r|\n/g)[1].trim().split(" ")[1]
    console.log('pre gapi', callerName)     
 
    const options = { limit: 5, delay: 2000, quotaExceeded: [429, 403]};
    const retrier = new Retrier(options);
    let response = await retrier
    .resolve(async attempt => await gapi.client.calendar.events.delete({
                                'calendarId': 'primary',
                                'eventId': eventId}))
    .then(
        result => {console.log('result', result);return result},
        error =>  {console.log(error) ;return error}
    );
    
    console.log('post gapi', callerName)  
                    
    return response  
   
  }
  