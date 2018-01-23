TC.Util.ExcelExport = function () {

    var EOL = '\r\n';
    var BOM = "\ufeff";

    /**
     * Stringify one field
     * @param data
     * @param delimier
     * @returns {*}
     */
    this.stringifyField = function (data, delimier, quoteText) {
        if (typeof data === 'string') {
            data = data.replace(/"/g, '""'); // Escape double qoutes
            if (quoteText || data.indexOf(',') > -1 || data.indexOf('\n') > -1 || data.indexOf('\r') > -1) data = delimier + data + delimier;
            return data;
        }

        if (typeof data === 'boolean') {
            return data ? 'TRUE' : 'FALSE';
        }

        return data;
    };

    /**
     * Creates a csv from a data array
     * @param data
     * @param options
     *  * header - Provide the first row (optional)
     *  * fieldSep - Field separator, default: ',',
     *  * addByteOrderMarker - Add Byte order mark, default(false)
     * @param callback
     */
    this.stringify = function (responseData, options) {

        var that = this;
        var csv = "";
        var csvContent = "";

        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var fromCharCode = String.fromCharCode;
        var INVALID_CHARACTER_ERR = (function () {
            // fabricate a suitable error object
            try {
                document.createElement('$');
            } catch (error) {
                return error;
            }
        }());

        // encoder
        window.btoa || (window.btoa = function (string) {
            var a, b, b1, b2, b3, b4, c, i = 0, len = string.length, max = Math.max, result = '';

            while (i < len) {
                a = string.charCodeAt(i++) || 0;
                b = string.charCodeAt(i++) || 0;
                c = string.charCodeAt(i++) || 0;

                if (max(a, b, c) > 0xFF) {
                    throw INVALID_CHARACTER_ERR;
                }

                b1 = (a >> 2) & 0x3F;
                b2 = ((a & 0x3) << 4) | ((b >> 4) & 0xF);
                b3 = ((b & 0xF) << 2) | ((c >> 6) & 0x3);
                b4 = c & 0x3F;

                if (!b) {
                    b3 = b4 = 64;
                } else if (!c) {
                    b4 = 64;
                }
                result += characters.charAt(b1) + characters.charAt(b2) + characters.charAt(b3) + characters.charAt(b4);
            }
            return result;
        });

        // decoder
        window.atob || (window.atob = function (string) {
            string = string.replace(/=+$/, '');
            var a, b, b1, b2, b3, b4, c, i = 0, len = string.length, chars = [];

            if (len % 4 === 1)
                throw INVALID_CHARACTER_ERR;

            while (i < len) {
                b1 = characters.indexOf(string.charAt(i++));
                b2 = characters.indexOf(string.charAt(i++));
                b3 = characters.indexOf(string.charAt(i++));
                b4 = characters.indexOf(string.charAt(i++));

                a = ((b1 & 0x3F) << 2) | ((b2 >> 4) & 0x3);
                b = ((b2 & 0xF) << 4) | ((b3 >> 2) & 0xF);
                c = ((b3 & 0x3) << 6) | (b4 & 0x3F);

                chars.push(fromCharCode(a));
                b && chars.push(fromCharCode(b));
                c && chars.push(fromCharCode(c));
            }
            return chars.join('');
        });

        var arrData = [];

        if ($.isArray(responseData)) {
            arrData = responseData;
        }
        else if ($.isFunction(responseData)) {
            arrData = responseData();
        }

        var dataString = '<thead valign="top">';
        for (var i = 0; i < 1; i++) {
            dataString += '<tr>';
            for (var j in arrData[i]) {
                if (arrData[i].hasOwnProperty(j)) {
                    dataString += '<th>' + arrData[i][j] + '</th>';
                }
            }

            dataString += '</tr>';
        }
        dataString += '</thead>';

        dataString += '<tbody>';

        //detectamos separador de miles y de coma en función de la confugración regional de la máquina
        var ds = (1.1).toLocaleString(navigator.language).substring(1, 2);
        var ms = (1000).toLocaleString(navigator.language).substring(1, 2);

        for (var i = 1; i < arrData.length; i++) {
            dataString += '<tr>';
            for (var j = 0; j < arrData[i].length; j++) {
                if (arrData[i].hasOwnProperty(j)) {
                    var item = arrData[i][j];
                    // Calculo de formato para Excel
                    var cls;
                    if (item !== null && (typeof item === "string" || typeof item === "number")) {
                        if (item.value) {
                            item = item.value;
                        }
                        if (("" + item).indexOf("%") != -1) {
                            item = item.replace(" %", "%").replace(/\.|,/g, ds);
                            cls = "percent";
                        } else {
                            var num = 0;
                            if (item) {
                                num = typeof item==="number" ? item: (new Number(item.replace ? (item.replace(/\./g, "").replace(/,/g, ".")).trim() : item.trim()));
                            }
                            if (!isNaN(num)) {
                                item = num.toString().replace(".", ds)
                                if (num % 1 > 0) {
                                    cls = "number2d";
                                } else {
                                    cls = "number";
                                }
                            } else {
                                if (/^\d{1,2}([.\/-])\d{1,2}\1(\d{4}|\d{2})$/.test(item)) {
                                    cls = "date";
                                } else {
                                    cls = "string";
                                }
                            }
                        }
                    } else {
                        cls = "string";
                    }
                    dataString += '<td class="' + cls + '"';
                    if (item && (item.hasOwnProperty('rowspan') || item.hasOwnProperty('colspan'))) {
                        if (item.hasOwnProperty('rowspan')) {
                            dataString += ' valign="top" rowspan="' + item.rowspan + '">' + item.value + '</td>';
                        } if (item.hasOwnProperty('colspan')) {
                            dataString += ' colspan="' + item.colspan + '">' + item.value + '</td>';
                        }
                        j++;
                    } else {
                        dataString += '>' + (item == null ? '' : item) + '</td>';
                    }
                }
            }
            dataString += '</tr>';
        }
        dataString += '</tbody>';

        var template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name=ProgId content=Excel.Sheet><meta name=Generator content="Microsoft Excel 9"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><style>';
        if (ds === ',')
            template += '<!--table{mso-displayed-decimal-separator:"\,"; mso-displayed-thousand-separator:"\.";}'
        else
            template += '<!--table{mso-displayed-decimal-separator:"\."; mso-displayed-thousand-separator:"\,";}'       
        template += 'body {visibility:hidden;}';
        template += '.number{mso-number-format:"\#\,\#\#0";} .number2d{mso-number-format:"\#\,\#\#0\.00";} .percent{mso-number-format:0.00%;} ';
        template += '.date{mso-number-format:"dd\/mm\/yyyy";} .string{mso-number-format:"\@";} caption{text-align:left;}--></style></head><body><table><caption>{caption}</caption>{table}</table></body></html>';
        var format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) };

        var ctx = { worksheet: options.workSheet || 'Hoja1', table: dataString, caption: options.title || "" };
        csv = format(template, ctx);

        return csv;
    };

};
TC.Util.ExcelExport.prototype.Save = function (filename, rows, title) {
    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] === null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += '\t';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    var csvFile;
    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    var exporter = this;
    csvFile = exporter.stringify(rows, { txtDelim: "\"", fieldSep: ";", title: title || "" });


    if (TC.Util.detectIE()) { //IE
        if (document.execCommand) {
            var downloadWin = window.open("about:blank", "_blank");
            downloadWin.document.write(csvFile);
            downloadWin.document.close();

            var success = downloadWin.document.execCommand('SaveAs', true, filename)
            downloadWin.close();
        }
    } else { //Resto de navegadores
        var uri = 'data:application/vnd.ms-excel;base64,';
        var base64 = function (s) { return window.btoa(unescape(encodeURIComponent(s))) };
        csvFile = uri + base64(csvFile);

        var downloadLink = $('<a></a>');
        downloadLink.attr('href', csvFile);
        downloadLink.attr('download', filename);

        $('body').append(downloadLink);
        window.setTimeout(function () {
            downloadLink[0].click();
            downloadLink.remove();
        }, null);
    }
};
