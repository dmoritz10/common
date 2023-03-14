//  database access

//  Sheets

function readOption(key, defaultReturn = '') {

    if (!arrOptions[key]) return defaultReturn
    if (arrOptions[key] == 'null') return defaultReturn
  
    try { var rtn = JSON.parse(arrOptions[key]) }
    catch (err) { var rtn = arrOptions[key] }
  
    return rtn
  
}

async function updateOption(key, val) {

  await writeThrottle(1)

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

  let response = await gapi.client.sheets.spreadsheets.values.update(params, resource)
    .then(async response => {               console.log('gapi updateOption first try', response)
        
        return response})

    .catch(async err  => {                  console.log('gapi updateOption catch', err)
        
        if (err.result.error.code == 401 || err.result.error.code == 403) {
            await Goth.token()              // for authorization errors obtain an access token
            let retryResponse = await gapi.client.sheets.spreadsheets.values.update(params, resource)
                .then(async retry => {      console.log('gapi updateOption retry', retry) 
                    
                    return retry})

                .catch(err  => {            console.log('gapi updateOption error2', err)
                    
                    bootbox.alert('gapi updateOption error: ' + err.result.error.code + ' - ' + err.result.error.message);

                    return null });         // cancelled by user, timeout, etc.

            return retryResponse

        } else {
            
            console.log('error updating option "' + key + '": ' + err.result.error.message);
            bootbox.alert('error updating option "' + key + '": ' + err.result.error.message);

            return null

        }
            
    })
    
                                            console.log('after gapi updateOption')      

}

// var openShts = async function (shts, ssId = spreadsheetId) {
async function openShts(shts, ssId = spreadsheetId) {


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

    let response = await gapi.client.sheets.spreadsheets.values.batchGet({spreadsheetId: ssId, ranges: shtRngs})
      .then(async response => {               console.log('gapi openShts first try', response)
          
          return response})

      .catch(async err  => {                  console.log('gapi openShts catch', err)
          
          if (err.result.error.code == 401 || err.result.error.code == 403) {
              await Goth.token()              // for authorization errors obtain an access token
              let retryResponse = await gapi.client.sheets.spreadsheets.values.batchGet({spreadsheetId: ssId, ranges: shtRngs})
                  .then(async retry => {      console.log('gapi openShts retry', retry) 
                      
                      return retry})

                  .catch(err  => {            console.log('gapi openShts error2', err)
                      
                      bootbox.alert('gapi openShts error: ' + err.result.error.code + ' - ' + err.result.error.message);

                      return null });         // cancelled by user, timeout, etc.

              return retryResponse

          } else {
              
              bootbox.alert('gapi openShts error: ' + shtTitle + ' - ' + err.result.error.message);
              return null

          }
              
      })
      
                                              console.log('after gapi openShts')


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

async function getSheetRange(rng, sht, ssId = spreadsheetId) {

    var response = await gapi.client.sheets.spreadsheets.values.batchGet({spreadsheetId: ssId, ranges: ["'" + sht + "'!" + rng]})
      .then(async response => {               console.log('gapi getSheetRange first try', response)
          
          return response})

      .catch(async err  => {                  console.log('gapi getSheetRange catch', err)
          
          if (err.result.error.code == 401 || err.result.error.code == 403) {
              await Goth.token()              // for authorization errors obtain an access token
              let retryResponse = await gapi.client.sheets.spreadsheets.values.batchGet({spreadsheetId: ssId, ranges: ["'" + sht + "'!" + rng]})
                  .then(async retry => {      console.log('gapi getSheetRange retry', retry) 
                      
                      return retry})

                  .catch(err  => {            console.log('gapi getSheetRange error2', err)
                      
                      bootbox.alert('gapi getSheetRange error: ' + err.result.error.code + ' - ' + err.result.error.message);

                      return null });         // cancelled by user, timeout, etc.

              return retryResponse

          } else {
              
            console.error('error reading sheet: ' + err.result.error.message);
            bootbox.alert('error reading sheet: ' + err.result.error.message);

              return null

          }
              
      })
      
                                              console.log('after gapi getSheetRange')

  return response

}

async function clearSheetRange(rng, sht, ssId = spreadsheetId) {

  await writeThrottle(1)

  var params = {
    spreadsheetId: ssId, 
    range: "'" + sht + "'!" + rng
  };


  var response = await gapi.client.sheets.spreadsheets.values.clear(params)
    .then(async response => {               console.log('gapi clearSheetRange first try', response)
        
        return response})

    .catch(async err  => {                  console.log('gapi clearSheetRange catch', err)
        
        if (err.result.error.code == 401 || err.result.error.code == 403) {
            await Goth.token()              // for authorization errors obtain an access token
            let retryResponse = await gapi.client.sheets.spreadsheets.values.clear(params)
                .then(async retry => {      console.log('gapi clearSheetRange retry', retry) 
                    
                    return retry})

                .catch(err  => {            console.log('gapi clearSheetRange error2', err)
                    
                    bootbox.alert('gapi clearSheetRange error: ' + err.result.error.code + ' - ' + err.result.error.message);

                    return null });         // cancelled by user, timeout, etc.

            return retryResponse

        } else {
            
          console.error('error clearing sheet: ' + err.result.error.message);
          bootbox.alert('error clearing sheet: ' + err.result.error.message);

            return null

        }
            
    })
    
                                            console.log('after gapi clearSheetRange')

return response

}

async function batchUpdateSheet(resource) {
  
  await writeThrottle(1)

  var response = await gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId: spreadsheetId, resource: sortSpec})
    .then(async response => {               console.log('gapi batchUpdateSheet first try', response)
        
        return response})

    .catch(async err  => {                  console.log('gapi batchUpdateSheet catch', err)
        
        if (err.result.error.code == 401 || err.result.error.code == 403) {
            await Goth.token()              // for authorization errors obtain an access token
            let retryResponse = await gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId: spreadsheetId, resource: sortSpec})
                .then(async retry => {      console.log('gapi batchUpdateSheet retry', retry) 
                    
                    return retry})

                .catch(err  => {            console.log('gapi batchUpdateSheet error2', err)
                    
                    bootbox.alert('gapi batchUpdateSheet error: ' + err.result.error.code + ' - ' + err.result.error.message);

                    return null });         // cancelled by user, timeout, etc.

            return retryResponse

        } else {
            
          console.error('error updating sheet'  + '": ' + err.result.error.message);
          bootbox.alert('error updating sheet'  + '": ' + err.result.error.message);

            return null

        }
            
    })
    
                                            console.log('after gapi batchUpdateSheet')

  return response

}

async function updateSheet(title, vals) {

  var nbrRows = vals.length
  var maxRows = 5000
  var strtRow = 0
  var currRow = 0

  var promiseArr = []

  while (vals.length > 0) {

    strtRow = currRow

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

    var rng = calcRngA1(strtRow + 1, 1, chunk.length, chunk[0].length)

    var params = {
    spreadsheetId: spreadsheetId,
    range: "'" + title + "'!" + rng,
    valueInputOption: 'RAW'
    };


    promiseArr.push(
       
      gapi.client.sheets.spreadsheets.values.update(params, resource)
        .then(async response => {               console.log('gapi updateSheet first try', response)
            
            return response})

        .catch(async err  => {                  console.log('gapi updateSheet catch', err)
            
            if (err.result.error.code == 401 || err.result.error.code == 403) {
                await Goth.token()              // for authorization errors obtain an access token
                let retryResponse = await gapi.client.sheets.spreadsheets.values.update(params, resource)
                    .then(async retry => {      console.log('gapi updateSheet retry', retry) 
                        
                        return retry})

                    .catch(err  => {            console.log('gapi updateSheet error2', err)
                        
                        bootbox.alert('gapi updateSheet error: ' + err.result.error.code + ' - ' + err.result.error.message);

                        return null });         // cancelled by user, timeout, etc.

                return retryResponse

            } else {
                
                bootbox.alert('gapi updateSheet error: ' + shtTitle + ' - ' + err.result.error.message);
                return null

            }
                
        })
        
    )
  }

  console.log('promiseArr', promiseArr)

  await writeThrottle(promiseArr.length)

  await Promise.all(promiseArr)

} 

async function updateSheetRow(vals, shtIdx, shtTitle, ssId = spreadsheetId) {

  await writeThrottle(1)

  var resource = {
    "majorDimension": "ROWS",
    "values": [vals]    
  }

    console.log('update', shtIdx)

    var row = shtIdx
    var rng = calcRngA1(row, 1, 1, vals.length)

    var params = {
      spreadsheetId: ssId,
      range: "'" + shtTitle + "'!" + rng,
      valueInputOption: 'RAW'
    };

    var response = await gapi.client.sheets.spreadsheets.values.update(params, resource)
      .then(async response => {               console.log('gapi updateSheetRow first try', response)
          
          return response})

      .catch(async err  => {                  console.log('gapi updateSheetRow catch', err)
          
          if (err.result.error.code == 401 || err.result.error.code == 403) {
              await Goth.token()              // for authorization errors obtain an access token
              let retryResponse = await gapi.client.sheets.spreadsheets.values.update(params, resource)
                  .then(async retry => {      console.log('gapi updateSheetRow retry', retry) 
                      
                      return retry})

                  .catch(err  => {            console.log('gapi updateSheetRow error2', err)
                      
                      bootbox.alert('gapi updateSheetRow error: ' + err.result.error.code + ' - ' + err.result.error.message);

                      return null });         // cancelled by user, timeout, etc.

              return retryResponse

          } else {
              
            console.error('error updating row: ' + err.result.error.message);
            bootbox.alert('error updating row: ' + err.result.error.message);

              return null

          }
              
      })
      
                                              console.log('after gapi updateSheetRow')

  return response

}

async function appendSheetRow(vals, shtTitle) {
  
  await writeThrottle(1)

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

    var response = await gapi.client.sheets.spreadsheets.values.append(params, resource)
      .then(async response => {               console.log('gapi updateSheetRow first try', response)
          
          return response})

      .catch(async err  => {                  console.log('gapi updateSheetRow catch', err)
          
          if (err.result.error.code == 401 || err.result.error.code == 403) {
              await Goth.token()              // for authorization errors obtain an access token
              let retryResponse = await gapi.client.sheets.spreadsheets.values.append(params, resource)
                  .then(async retry => {      console.log('gapi updateSheetRow retry', retry) 
                      
                      return retry})

                  .catch(err  => {            console.log('gapi updateSheetRow error2', err)
                      
                      console.error('error appending row "' + shtTitle + '": ' + err.result.error.message);
                      bootbox.alert('error appending row "' + shtTitle + '": ' + err.result.error.message);
                      
                      return null });         // cancelled by user, timeout, etc.

              return retryResponse

          } else {
              
              bootbox.alert('gapi updateSheetRow error: ' + shtTitle + ' - ' + err.result.error.message);
              return null

          }
              
      })
        
                                                console.log('after gapi updateSheetRow')

  return response

}

async function deleteSheetRow(idx, sheetName) {

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

  let response = await gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId: spreadsheetId, resource: request})
        .then(async response => {               console.log('gapi deleteSheetRow first try', response)
            
            return response})

        .catch(async err  => {                  console.log('gapi deleteSheetRow catch', err)
            
            if (err.result.error.code == 401 || err.result.error.code == 403) {
                await Goth.token()              // for authorization errors obtain an access token
                let retryResponse = await gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId: spreadsheetId, resource: request})
                    .then(async retry => {      console.log('gapi deleteSheetRow retry', retry) 
                        
                        return retry})

                    .catch(err  => {            console.log('gapi deleteSheetRow error2', err)
                        
                        bootbox.alert('gapi deleteSheetRow error: ' + err.result.error.code + ' - ' + err.result.error.message);

                        return null });         // cancelled by user, timeout, etc.

                return retryResponse

            } else {
                
                bootbox.alert('gapi deleteSheetRow error: ' + shtTitle + ' - ' + err.result.error.message);
                return null

            }
                
        })
        
                                                console.log('after gapi')
  
        return response

}

async function updateSheetHdr(vals, shtTitle) {

  await writeThrottle(1)

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

    var response = await gapi.client.sheets.spreadsheets.values.update(params, resource)
      .then(async response => {               console.log('gapi updateSheetHdr first try', response)
          
          return response})

      .catch(async err  => {                  console.log('gapi updateSheetHdr catch', err)
          
          if (err.result.error.code == 401 || err.result.error.code == 403) {
              await Goth.token()              // for authorization errors obtain an access token
              let retryResponse = await gapi.client.sheets.spreadsheets.values.update(params, resource)
                  .then(async retry => {      console.log('gapi updateSheetHdr retry', retry) 
                      
                      return retry})

                  .catch(err  => {            console.log('gapi updateSheetHdr error2', err)
                      
                      bootbox.alert('gapi updateSheetRow error: ' + err.result.error.code + ' - ' + err.result.error.message);

                      return null });         // cancelled by user, timeout, etc.

              return retryResponse

          } else {
              
            console.error('error updating row "' + shtTitle + '": ' + err.result.error.message);
            bootbox.alert('error updating row "' + shtTitle + '": ' + err.result.error.message);

              return null

          }
              
      })
      
                                              console.log('after gapi updateSheetHdr')

    return response

}

async function sortSheet(sortSpec, shtTitle) {
  
  await writeThrottle(1)


  sortSpec.requests[0].sortRange.range.sheetId = await getSheetId(shtTitle)
  console.log('sortSpec', sortSpec)

  var response = await gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId: spreadsheetId, resource: sortSpec})
    .then(async response => {               console.log('gapi renameSheet first try', response)
        
        return response})

    .catch(async err  => {                  console.log('gapi renameSheet catch', err)
        
        if (err.result.error.code == 401 || err.result.error.code == 403) {
            await Goth.token()              // for authorization errors obtain an access token
            let retryResponse = await gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId: spreadsheetId, resource: sortSpec})
                .then(async retry => {      console.log('gapi renameSheet retry', retry) 
                    
                    return retry})

                .catch(err  => {            console.log('gapi renameSheet error2', err)
                    
                    bootbox.alert('gapi renameSheet error: ' + err.result.error.code + ' - ' + err.result.error.message);

                    return null });         // cancelled by user, timeout, etc.

            return retryResponse

        } else {
            
          console.error('error updating row'  + '": ' + err.result.error.message);
          bootbox.alert('error updating row'  + '": ' + err.result.error.message);

            return null

        }
            
    })
    
                                            console.log('after gapi renameSheet')

  return response

}

async function renameSheet(shtId, shtTitle) {
  
  await writeThrottle(1)

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
    
  var response = await gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId: spreadsheetId, resource: rq})
    .then(async response => {               console.log('gapi renameSheet first try', response)
        
        return response})

    .catch(async err  => {                  console.log('gapi renameSheet catch', err)
        
        if (err.result.error.code == 401 || err.result.error.code == 403) {
            await Goth.token()              // for authorization errors obtain an access token
            let retryResponse = await gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId: spreadsheetId, resource: rq})
                .then(async retry => {      console.log('gapi renameSheet retry', retry) 
                    
                    return retry})

                .catch(err  => {            console.log('gapi renameSheet error2', err)
                    
                    bootbox.alert('gapi renameSheet error: ' + err.result.error.code + ' - ' + err.result.error.message);

                    return null });         // cancelled by user, timeout, etc.

            return retryResponse

        } else {
            
          console.error('error updating row'  + '": ' + err.result.error.message);
          bootbox.alert('error updating row'  + '": ' + err.result.error.message);

            return null

        }
            
    })
    
                                            console.log('after gapi renameSheet')

  return response

}

async function copySheet(shtId) {

  await writeThrottle(1)

  var params = {
    spreadsheetId: spreadsheetId,  
    sheetId: shtId,  
  };

  var copySheetToAnotherSpreadsheetRequestBody = {
    destinationSpreadsheetId: spreadsheetId
  };

    
  var response = await gapi.client.sheets.spreadsheets.sheets.copyTo(params, copySheetToAnotherSpreadsheetRequestBody)
    .then(async response => {               console.log('gapi copySheet first try', response)
        
        return response})

    .catch(async err  => {                  console.log('gapi copySheet catch', err)
        
        if (err.result.error.code == 401 || err.result.error.code == 403) {
            await Goth.token()              // for authorization errors obtain an access token
            let retryResponse = await gapi.client.sheets.spreadsheets.sheets.copyTo(params, copySheetToAnotherSpreadsheetRequestBody)
                .then(async retry => {      console.log('gapi copySheet retry', retry) 
                    
                    return retry})

                .catch(err  => {            console.log('gapi copySheet error2', err)
                    
                    bootbox.alert('gapi updateSheetRow error: ' + err.result.error.code + ' - ' + err.result.error.message);

                    return null });         // cancelled by user, timeout, etc.

            return retryResponse

        } else {
            
          console.error('error copying sheet "' + shtId + '": ' + err.result.error.message);
          bootbox.alert('error copying sheet "' + shtId + '": ' + err.result.error.message);

            return null

        }
            
    })
    
                                            console.log('after gapi copySheet')

  return response

}

async function getSheets() {

  let response = await gapi.client.sheets.spreadsheets.get({spreadsheetId: spreadsheetId})
        .then(async response => {               console.log('gapi getSheets first try', response)
            
            return response})

        .catch(async err  => {                  console.log('gapi getSheets catch', err)
            
            if (err.result.error.code == 401 || err.result.error.code == 403) {
                await Goth.token()              // for authorization errors obtain an access token
                let retryResponse = gapi.client.sheets.spreadsheets.get({spreadsheetId: spreadsheetId})
                    .then(async retry => {      console.log('gapi getSheets retry', retry) 
                        
                        return retry})

                    .catch(err  => {            console.log('gapi getSheets error2', err)
                        
                        bootbox.alert('gapi getSheets error: ' + err.result.error.code + ' - ' + err.result.error.message);

                        return null });         // cancelled by user, timeout, etc.

                return retryResponse

            } else {
                
                bootbox.alert('gapi getSheets error: ' + shtTitle + ' - ' + err.result.error.message);
                return null

            }
                
        })
        
                                                console.log('after gapi getSheets')
  
        return response

}

async function getSheetId(shtTitle) {

  var sheets = await gapi.client.sheets.spreadsheets.get({
        
    spreadsheetId: spreadsheetId
  
  }).then(function(response) {
    
    return response.result.sheets
  
  }, function(err) {
    console.log('Error: ' + err.result.error.message);
    return null

  });


  for (var j = 0; j < sheets.length; j++) {

    var sht = sheets[j].properties

    if (sht.title == shtTitle) return sht.sheetId

  }

  return null
}

var wtArr = []

async function writeThrottle(nbrWrites = 1) {

  const maxWritesPerMin = 30
  const delay = (ms) => new Promise(res => setTimeout(res, ms));
  const ts = (dt) => dt.toISOString().substring(11,23)

console.log('begin', ts(new Date()))
  
  // var wtArr = writeThrottleArr
  var oma = new Date();
  oma.setMinutes(oma.getMinutes() - 1);

  console.log('writeThrottle', ts(oma), wtArr.map( ele => ts(ele)), wtArr.map( ele => ele - oma))
  // console.log('oma', ts(oma), ts(wtArr[i]), wtArr[i] < oma)

  for (let i=wtArr.length-1; i>=0; i--) {
    if (wtArr[i] < oma) {console.log('remove wtArr', i, ts(wtArr[i]), ts(oma));wtArr.splice(i, 1)}
    
  }

  if (wtArr.length > maxWritesPerMin - nbrWrites - 3) {
    
    console.log('delay', wtArr[0] - oma)
    await delay (wtArr[0] - oma);
    console.log('delay resume', ts(new Date()))
  
  }

  console.log('resume', ts(new Date()))

  for (let i = 0;i<nbrWrites;i++) wtArr.push(new Date())

  return

}


//  Drive

async function listDriveFiles(sheetName) {

  let q = "name = '" + sheetName +
                      "' AND " + "mimeType='application/vnd.google-apps.spreadsheet'" +
                      " AND " + "trashed = false"


  let response = await gapi.client.drive.files.list({
                              q: q,
                              fields: 'nextPageToken, files(id, name, ownedByMe)',
                              spaces: 'drive'})

    .then(async response => {               console.log('gapi listDriveFiles first try', response)
        
        return response})

    .catch(async err  => {                  console.log('gapi listDriveFiles catch', err)
        
        if (err.result.error.code == 401 || err.result.error.code == 403) {
            await Goth.token()              // for authorization errors obtain an access token
            let retryResponse = await gapi.client.drive.files.list({
                                    q: q,
                                    fields: 'nextPageToken, files(id, name, ownedByMe)',
                                    spaces: 'drive'})
                .then(async retry => {      console.log('gapi listDriveFiles retry', retry) 
                    
                    return retry})

                .catch(err  => {            console.log('gapi listDriveFiles error2', err)
                    
                    bootbox.alert('gapi listDriveFiles error: ' + err.result.error.code + ' - ' + err.result.error.message);

                    return null });         // cancelled by user, timeout, etc.

            return retryResponse

        } else {
            
            bootbox.alert('gapi listDriveFiles error: ' + shtTitle + ' - ' + err.result.error.message);
            return null

        }
            
    })
        
                                                console.log('after gapi')
  
  return response

}

async function getSSId(sheetName) {

  var response = await listDriveFiles(sheetName)

  if (!response) return

  var files = response.result.files

  if (!files || files.length == 0)
      return { fileId: null, msg: "'" + sheetName + "' not found" }

  if (files.length > 1)
      return { fileId: null, msg: "'" + sheetName + "' not unique" }

  return { fileId: files[0].id, msg: 'ok' }

}

async function createDriveFile() {

  let resource = {                  
      name : 'Sheet',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: ['1eAwbR_yzsEaEpBEpFA0Pqp8KGP2XszDY']
    }

  let response = await gapi.client.drive.files.create({resource: resource})

    .then(async response => {               console.log('gapi createDriveFile first try', response)
        
        return response})

    .catch(async err  => {                  console.log('gapi createDriveFile catch', err)
        
        if (err.result.error.code == 401 || err.result.error.code == 403) {
            await Goth.token()              // for authorization errors obtain an access token
            let retryResponse = await gapi.client.drive.files.create({resource: resource})
                .then(async retry => {      console.log('gapi createDriveFile retry', retry) 
                    
                    return retry})

                .catch(err  => {            console.log('gapi createDriveFile error2', err)
                    
                    bootbox.alert('gapi createDriveFile error: ' + err.result.error.code + ' - ' + err.result.error.message);

                    return null });         // cancelled by user, timeout, etc.

            return retryResponse

        } else {
            
            bootbox.alert('gapi createDriveFile error: ' +  err.result.error.message);
            return null

        }
            
    })
        
                                                console.log('after gapi')
  
  return response

}

async function deleteDriveFile(fileId) {

  let response = await gapi.client.drive.files.delete({fileId : fileId})

    .then(async response => {               console.log('gapi deleteDriveFile first try', response)
        
        return response})

    .catch(async err  => {                  console.log('gapi deleteDriveFile catch', err)
        
        if (err.result.error.code == 401 || err.result.error.code == 403) {
            await Goth.token()              // for authorization errors obtain an access token
            let retryResponse = await gapi.client.drive.files.delete({fileId : fileId})
                .then(async retry => {      console.log('gapi deleteDriveFile retry', retry) 
                    
                    return retry})

                .catch(err  => {            console.log('gapi deleteDriveFile error2', err)
                    
                    bootbox.alert('gapi listDriveFiles error: ' + err.result.error.code + ' - ' + err.result.error.message);

                    return null });         // cancelled by user, timeout, etc.

            return retryResponse

        } else {
            
            bootbox.alert('gapi deleteDriveFile error: ' + shtTitle + ' - ' + err.result.error.message);
            return null

        }
            
    })
        
                                                console.log('after gapi')
  
  return response

}

async function renameDriveFile(fileId, fileName) {

  let response = await gapi.client.drive.files.update({fileId : fileId, resource: { name: fileName}})

    .then(async response => {               console.log('gapi renameDriveFile first try', response)
        
        return response})

    .catch(async err  => {                  console.log('gapi renameDriveFile catch', err)
        
        if (err.result.error.code == 401 || err.result.error.code == 403) {
            await Goth.token()              // for authorization errors obtain an access token
            let retryResponse = await gapi.client.drive.files.update({fileId : fileId, resource: { name: fileName}})
                .then(async retry => {      console.log('gapi renameDriveFile retry', retry) 
                    
                    return retry})

                .catch(err  => {            console.log('gapi renameDriveFile error2', err)
                    
                    bootbox.alert('gapi renameDriveFile error: ' + err.result.error.code + ' - ' + err.result.error.message);

                    return null });         // cancelled by user, timeout, etc.

            return retryResponse

        } else {
            
            bootbox.alert('gapi renameDriveFile error: ' + err.result.error.message);
            return null

        }
            
    })
        
                                                console.log('after gapi')
  
  return response

}

//  Calendar

async function updateCalendarEvent(eventId, event) {

  var request = await gapi.client.calendar.events.update({
    'calendarId': 'primary',
    'eventId': eventId,
    'resource': event
  });

  return request

}

async function insertCalendarEvent(event) {

  var request = await gapi.client.calendar.events.insert({
    'calendarId': 'primary',
    'resource': event
  });

  return request

}

async function deleteCalendarEvent(eventId) {

  var request = await gapi.client.calendar.events.delete({
    'calendarId': 'primary',
    'eventId': eventId
  });

  return request

}
