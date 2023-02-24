

function Table() {
    //sets attributes
    this.header = [];
    this.data = [[]];
    this.tableClass = '';
    this.trClass = '';
    this.tdClass = '';
    this.tableHeaderClass = ''
    
}

Table.prototype.setHeader = function(keys) {
    //sets header data
    if (keys) {
      this.header = keys
    }
    return this
}
 
Table.prototype.setData = function(data) {
    //sets the main data
    this.data = data
    return this
}
 
Table.prototype.setTableClass = function(tableClass) {
    //sets the table class name
    if (tableClass) {
      this.tableClass = tableClass
    }
    return this
}

Table.prototype.setTrClass = function(trClass) {
    //sets the table class name
    if (trClass) {
      this.trClass = trClass
    }
      return this
}

Table.prototype.setTcClass = function(tcClass) {
    //sets the table class name
    if (tcClass) {
      this.tcClass = tcClass
    }
    return this
}

Table.prototype.setTdClass = function(tdClass) {
    //sets the table class name
    if (tdClass) {
      this.tdClass = tdClass
    }
    return this
}

Table.prototype.setTableHeaderClass = function(tableHeaderClass) {
    //sets the table class name
    if (tableHeaderClass) {
      this.tableHeaderClass = tableHeaderClass
    }
    return this
}

Table.prototype.build = function(container) {

    //default selector
    container = container || $('<div></div>')
 
    var tcClass = this.tcClass
 
    //creates table
    var table = $('<table></table>').addClass(this.tableClass)
 
    var tr = $('<tr></tr>').addClass(this.trClass) //creates row
    var th = $('<th></th>').addClass(this.tableHeaderClass) //creates table header cells
    var td = $('<td></td>').addClass(this.tdClass) //creates table cells
 
    var header = tr.clone() //creates header row
 
    //fills header row
    this.header.forEach(function(d) {
        header.append(th.clone().html(d))
    })
 
    //attaches header row
    table.append($('<thead></thead>').append(header))
    
    //creates 
    var tbody = $('<tbody></tbody>')
 
    //fills out the table body
    this.data.forEach(function(d) {
        var row = tr.clone() //creates a row
        d.forEach(function(e,j) {
        
            row.append(td.clone().html(e).addClass(tcClass[j])) //fills in the row
        })
        
        tbody.append(row) //puts row on the tbody
        
    })
    
    $(container).empty()
    $(container).append(table.append(tbody)) //puts entire table in the container
    this.html = $(container)[0].innerHTML.replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    // if no 'container' is provided, calling routines use this.html
    
    
    $(container).empty()
    
    var dom = document.createElement('tbl');
    dom.classList.add("w-100");
    // dom.className = this.tableClass
    dom.innerHTML = this.html;
    $(container).append(dom);
     
    // if a 'container' is provided this will properly include embedded html
}

