import Component from '@ember/component';

/* 
    TODO: Make Replace Dialog Draggable
    TODO: Make details section more useful
    TODO: Make search work on element text too
*/

var _this = null;

export default Component.extend({
    loaded: false,
    fs: '|', // Field Separator
    cs: '^', //Component Separator
    rs: '~', //Repetition Separator
    scs: '&', //Subcomponent Separator
    ec: '\\', //Escape Character
    tc: '#', //Truncation Character (added in 2.7)
    hl7Element: '',
    clickElement: null,
    wordWrap: true,
    matchLocation: -1,
    matchOriginal: '',
    matchNew: '',
    preMatchMessage: '',
    matchLocations: null,
    getSpan: function (text, className, data) {
        let classDec = '';
        let dataDec = '';
        if (className) {
            classDec = ` class="${className}"`;
        }
        if (data) {
            dataDec = ` data-hl7="${data}"`;
        }
        return `<span${classDec}${dataDec}>${text}</span>`;
    },
    getField: function (field, dataDec) {
        let retVal = '';
        if (field.indexOf(this.rs) > -1) {
            let reps = field.split(this.rs);
            for (let i = 0; i < reps.length; ++i) {
                if (i > 0) {
                    retVal += this.getSpan(this.rs, 'repetitionSep sep');
                }
                retVal += this.getField(reps[i], dataDec + this.rs + (i + 1));
            }
        } else if (field.indexOf(this.cs) > -1) {
            retVal = this.getSpan(this.getComponents(field, dataDec), 'field', dataDec);
        } else {
            retVal = this.getSpan(field, 'field', dataDec);
        }
        retVal = this.handleEscapeSequence(retVal);
        return retVal;
    },
    getComponents: function (field, dataDec, isSub) {
        let sep = this.cs;
        let retVal = '';
        let classDec = 'component';

        if (isSub) {
            sep = this.scs;
            classDec = 'subComponent';
        }
        let components = field.split(sep);
        for (let i = 0; i < components.length; ++i) {
            let newDataDec = dataDec + '-' + (i + 1);
            if (i > 0) {
                retVal += this.getSpan(sep, classDec + 'Sep sep');
            }
            if (!isSub && components[i].indexOf(this.scs) > -1) {
                retVal += this.getSpan(this.getComponents(components[i], newDataDec, true), classDec, newDataDec);

            } else {
                retVal += this.getSpan(components[i], classDec, newDataDec);
            }

        }
        return retVal;
    },
    updateSpans: function (className, oldVal, newVal) {
        if (oldVal !== newVal) {
            let elements = document.getElementsByClassName(className);
            for (let i = 0; i < elements.length; ++i) {
                elements[i].innerText = newVal;
            }
        }
        return newVal;
    },
    inputEventHandler: function (e) {
        e.target.removeEventListener('blur', this.inputEventHandler);
        let className = e.target.parentNode.className;
        if (className === 'fieldSep') {
            e.target.parentNode.innerText = e.target.innerText;
            _this.fs = _this.updateSpans(className, _this.fs, e.target.innerText);
        } else if (className === 'componentSep') {
            e.target.parentNode.innerText = e.target.innerText;
            _this.cs = _this.updateSpans(className, _this.cs, e.target.innerText);
        } else if (className === 'repetitionSep') {
            e.target.parentNode.innerText = e.target.innerText;
            _this.rs = _this.updateSpans(className, _this.rs, e.target.innerText);
        } else if (className === 'subComponentSep') {
            e.target.parentNode.innerText = e.target.innerText;
            _this.scs = _this.updateSpans(className, _this.scs, e.target.innerText);
        } else if (className === 'escapeChar') {
            e.target.parentNode.innerText = e.target.innerText;
            _this.ec = _this.updateSpans(className, _this.ec, e.target.innerText);
        } else if (className === 'truncationChar') {
            e.target.parentNode.innerText = e.target.innerText;
            _this.tc = _this.updateSpans(className, _this.tc, e.target.innerText);
        } else {
            // reconsturct the segment to ensure that we correct for added separators
            let displayNode = document.getElementById('hl7MessageDisplay');
            let ele = e.target;
            let newText = e.target.innerText;
            let originalText = e.target.dataset.original;

            if (newText !== originalText && originalText !== '') {
                // tagging with garbage string so we can skip it when replacing later
                ele.innerHTML = '---added---517704' + e.target.innerText;
            }

            do {
                ele = ele.parentNode;
            } while (ele.tagName !== 'DIV');
            if (ele) {
                let segString = _this.getStringFromSegmentDiv(ele);
                let newNode = document.createElement('div');
                newNode.innerHTML = _this.getSegment(segString, _this);
                ele.replaceWith(newNode.firstChild);
            }
            if (newText !== originalText && originalText !== '') {
                _this.matchLocations = [];
                _this.hl7Element.removeEventListener('click', _this.handleClick);
                let replaceModalNode = document.getElementById("replaceModal");
                replaceModalNode.style.display = "inline-block";
                let newHtml = _this.getStringFromMessage(displayNode);//`<pre>${_this.getStringFromMessage(displayNode)}</pre>`;
                let tempNode = document.createTextNode(newHtml);
                let tempDiv = document.createElement('div');
                tempDiv.appendChild(tempNode);
                newHtml = `<pre>${tempDiv.innerHTML}</pre>`;
                _this.matchLocations.push(newHtml.indexOf('---added---517704'));
                displayNode.innerHTML = newHtml.replace('---added---517704', '');//.replace(/\r/g, '<br>');
                _this.matchLocation = -1;
                _this.nextMatch(originalText, newText, displayNode, replaceModalNode);
            }
        }
    },
    nextMatch: function (oldVal, newVal, node, modalNode) {
        let newString = node.innerHTML;
        _this.matchLocation = newString.toUpperCase().indexOf(oldVal.toUpperCase(), _this.matchLocation);
        if (_this.matchLocation === -1) {
            modalNode.style.display = 'none';
            this.loaded = false;
            _this.showMessage(node.firstChild.innerText);
        } else if (_this.matchLocations.includes(_this.matchLocation)) {
            if (newString.indexOf(newVal, _this.matchLocation) === _this.matchLocation) {
                _this.matchLocation += newVal.length;
            } else {
                _this.matchLocation += oldVal.length;
            }
            _this.nextMatch(oldVal, newVal, node, modalNode);
        } else {
            if (_this.matchLocation < _this.matchLocations[0]) {
                _this.matchLocations[0] += newVal.length - oldVal.length;
            }
            _this.matchLocations.push(_this.matchLocation);
            _this.matchOriginal = newString.substring(_this.matchLocation, _this.matchLocation + oldVal.length);
            _this.matchNew = _this.matchCase(_this.matchOriginal, newVal);
            modalNode.getElementsByClassName('modalBody')[0].innerText = `replace ${_this.matchOriginal} with ${_this.matchNew}?`;
            let foundSpan = document.createElement('span');
            foundSpan.innerText = oldVal;
            foundSpan.className = 'found';
            foundSpan.id = 'match';
            let newHtml = newString.substring(0, _this.matchLocation) +
                foundSpan.outerHTML +
                newString.substring(_this.matchLocation + oldVal.length);
            node.innerHTML = newHtml;
            foundSpan = document.getElementById('match');
            _this.hl7Element.scrollTop = foundSpan.offsetTop - _this.hl7Element.offsetTop;
            //foundSpan.appendChild(modalNode);
            modalNode.style.top = `${_this.hl7Element.offsetTop + 25}px`;
            modalNode.style.left = `${foundSpan.offsetLeft + foundSpan.offsetWidth + 10}px`;
            document.getElementById('replace').focus();
        }
    },
    clearMatch: function (val, skipNext) {
        let node = document.getElementById('hl7MessageDisplay');
        let modal = document.getElementById('replaceModal');
        let foundSpan = document.getElementById('match');
        let newString = node.innerHTML;
        newString = newString.replace(foundSpan.outerHTML, val);
        node.innerHTML = newString;
        if (!skipNext) {
            _this.matchLocation = _this.matchLocation + val.length;
            _this.nextMatch(_this.matchOriginal, _this.matchNew, node, modal);
        }
    },
    matchCase: function (originalString, newString) {
        let replacement = '';
        for (let i = 0; i < originalString.length; ++i) {
            let c = originalString.charAt(i);
            if (c.toUpperCase() === c) {
                replacement += newString.charAt(i).toUpperCase();
            } else {
                replacement += newString.charAt(i).toLowerCase();
            }
        }
        if (newString.length > originalString.length) {
            replacement += newString.substring(originalString.length);
        }
        return replacement;
    },
    getSegment: function (val, t) {
        let segmentId = val.substring(0, 3);
        let htmlOutput = `<div class="segment" data-hl7="${segmentId}">`;
        htmlOutput += t.getSpan(segmentId, 'segmentId', 'Segment Id');
        let fields = val.split(t.fs);
        for (let f = 1; f < fields.length; ++f) {
            if (segmentId === 'MSH' && f === 1) {
                let fieldSpan = t.getSpan(t.fs, 'fieldSep', 'MSH-1');
                let componentSpan = t.getSpan(t.cs, 'componentSep');
                let repetitionSpan = t.getSpan(t.rs, 'repetitionSep');
                let escapeSpan = t.getSpan(t.ec, 'escapeChar');
                let scsSpan = t.getSpan(t.scs, 'subComponentSep');
                let truncSpan = '';
                if (t.tc) {
                    truncSpan = t.getSpan(t.tc, 'truncationChar');
                }
                let encSpan = t.getSpan(`${componentSpan}${repetitionSpan}${escapeSpan}${scsSpan}${truncSpan}`, null, 'MSH-2');
                htmlOutput += t.getSpan(`${fieldSpan}${encSpan}`,
                    'encodingChars');
            } else {
                let dataDec = segmentId;
                if (segmentId === 'MSH') {
                    dataDec += '-' + (f + 1);
                } else {
                    dataDec += '-' + f;
                }
                htmlOutput += t.getSpan(t.fs, 'fieldSep sep') + t.getField(fields[f], dataDec);
            }
        }
        htmlOutput += '</div>';
        return htmlOutput;
    },
    getStringFromSegmentDiv: function (seg) {
        let segmentOutput = '';
        for (let i = 0; i < seg.children.length; ++i) {
            if (seg.children[i].tagName === 'SPAN') {
                segmentOutput += seg.children[i].innerText;
            }
        }
        return segmentOutput;
    },
    getStringFromMessage: function (node) {
        if (!node) {
            node = document.getElementById('hl7MessageDisplay');
        }
        let divs = node.getElementsByTagName('div');
        let messageString = '';
        for (let i = 0; i < divs.length; ++i) {
            messageString += _this.getStringFromSegmentDiv(divs[i]) + '\r';
        }
        return messageString;
    },
    handleEscapeSequence: function (val) {
        let retVal = val;
        let ec = this.ec;
        if (ec === '\\') {
            ec = '\\\\';
        }
        let reg = new RegExp(`${ec}.+?${ec}`, 'g');///\\.+?\\/g;
        retVal = retVal.replace(reg, (match) => {
            let innerString = match.replace(new RegExp(ec, 'g'), '');
            let ecSpan = this.getSpan(this.ec, 'escapeChar', 'Escape Character');
            // TODO: Get the specific escape sequence based on HL7 spec
            return this.getSpan(ecSpan + innerString + ecSpan, 'escapeSequence', '');
        });
        return retVal;
    },
    handleClick: function (e) {
        if (e.target.tagName === "SPAN" &&
            !e.target.classList.contains('input') &&
            e.target === _this.clickElement) {
            let node;
            _this.preMatchMessage = _this.getStringFromMessage();
            if (e.target.classList.contains('sep')) {
                node = e.target.nextSibling;
            } else if (e.target.classList.contains('escapeSequence')) {
                node = e.target.parentNode;
            } else if (e.target.parentNode.classList.contains('escapeSequence')) {
                node = e.target.parentNode.parentNode;
            }
            else {
                node = e.target;
            }
            if (!e.target) {
                return;
            }
            e.preventDefault();
            let hl7Text = node.innerText;

            node.innerHTML = `<span contenteditable class="input" data-class="${node.className}" data-original="${hl7Text}" type="text" id="elementInput">${hl7Text}</span>`;
            let input = document.getElementById('elementInput');
            input.addEventListener('blur', _this.inputEventHandler);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.target.innerHTML = e.target.dataset.original;
                    e.target.blur();
                }
            });
            input.focus();
            document.execCommand('selectAll', false, null);
        }
    },
    showMessage: function (msg, noSearch) {
        _this = this;
        let htmlOutput = '<main class="hl7MessageDisplay" id="hl7MessageDisplay">';

        if (msg.substring(0, 3) === 'MSH' || msg.substring(0, 3) === 'FHS') {            
            this.hl7Element.innerHTML = this.getSpan('loading message...', 'loading');
            this.loaded = true;
            this.fs = msg.charAt(3);
            this.cs = msg.charAt(4);
            this.rs = msg.charAt(5);
            this.ec = msg.charAt(6);
            this.scs = msg.charAt(7);
            /* the truncation char was added in 2.7, 
            so older messages won't have it*/
            if (msg.charAt(8) !== this.fs) {
                this.tc = msg.charAt(8);
            } else {
                this.tc = '';
            }
            // Sanitize line endings
            msg = msg.replace(/\r\n/g, '\r');
            msg = msg.replace(/\n/g, '\r');

            let segments = msg.split('\r');
            for (let i = 0; i < segments.length; ++i) {
                htmlOutput += this.getSegment(segments[i], this);
            }
            this.hl7Element.innerHTML = htmlOutput;
            document.getElementById('wordWrap').disabled = null;
            this.hl7Element.addEventListener('mouseover', (e) => {
                let node;
                if (e.target.classList.contains('sep')) {
                    node = e.target.nextSibling;
                } else {
                    node = e.target;
                }
                if (node.dataset.hl7) {
                    let hintText = `${node.dataset.hl7}: ${node.innerText}`;
                    document.getElementById('hl7Footer').innerText = hintText;
                } else if (node.parentNode.dataset.hl7) {
                    let hintText = `${node.parentNode.dataset.hl7}: ${node.parentNode.innerText}`;
                    document.getElementById('hl7Footer').innerText = hintText;
                } else {
                    document.getElementById('hl7Footer').innerText = '';
                }
            });
            this.hl7Element.addEventListener('mousedown', (e) => {
                this.clickElement = e.target;
            });
            this.hl7Element.addEventListener('click', this.handleClick);
            if (!noSearch) {
                // let responses = this.search('PID-5', this.hl7Element, true).map((val) => {
                //     return `Patient Name: ${val}`;
                // });
                // this.setDetailNode(responses, 'Message Info', document.getElementById('fromMessage'));
                Ember.$.getJSON('assets/details.json', (data) => {
                    let responses = [];
                    for (let i = 0; i< data.length; ++i) {
                        responses = responses.concat(this.search(data[i].field, this.hl7Element, true).map((val =>{
                            return `${data[i].label}: ${val}`;
                        })));
                        this.setDetailNode(responses, 'Message Info', document.getElementById('fromMessage'));
                    }
                });
            }
        } else {
            this.hl7Element.innerHTML = `<div class="error">${this.getSpan('Not a valid hl7 message: missing MSH segment')}</div>`;
        }
    },
    search: function (searchText, node, skipHighlight, reload, responses, foundNodes) {
        _this.loaded = false;
        if (!responses) {
            responses = [];
        }
        if (reload) {
            _this.showMessage(_this.getStringFromMessage(), true);
        }
        if (searchText) {

            if (!foundNodes) {
                foundNodes = [];
            }
            for (let i = 0; i < node.children.length; ++i) {
                let child = node.children[i];
                if (child.dataset.hl7) {
                    if (child.dataset.hl7 === searchText) {
                        responses.push(child.innerText);
                        if (!skipHighlight) {
                            child.classList.add('found');
                        }
                    } else if (child.innerText.toUpperCase() === searchText.toUpperCase()) {
                        responses.push(child.dataset.hl7);
                        if (!skipHighlight) {
                            child.classList.add('found');
                        }
                    } else if (child.innerText.toUpperCase().indexOf(searchText.toUpperCase()) > -1) {
                        // set this aside rather than edit the array we're looping on
                        foundNodes.push(child);
                        responses.push(child.dataset.hl7);
                        if (responses.includes(child.parentNode.dataset.hl7)) {
                            responses.splice(responses.indexOf(child.parentNode.dataset.hl7), 1);
                            if (foundNodes.includes(child.parentNode)) {
                                foundNodes.splice(child.parentNode, 1);
                            }
                        }
                    } else {
                        if (child.classList.contains('found')) {
                            child.classList.remove('found');
                        }
                    }
                }
                if (child.children.length > 0) {
                    this.search(searchText, child, skipHighlight, false, responses, foundNodes);
                }
            }

            for (let i = 0; i < foundNodes.length; ++i) {
                //foundNodes[i].innerHTML = foundNodes[i].innerHTML.replace(new RegExp(searchText, 'gi'), `<span class="found foundText">${searchText}</span>`);
                let html = foundNodes[i].innerHTML;
                let output = '';
                let index = -1;
                let lastEnd = 0;
                do {
                    // html.substring(0, index) + '***' + html.substring(index, index + searchText.length) + '***'
                    index = html.toUpperCase().indexOf(searchText.toUpperCase(), index);
                    if (index > -1) {
                        output += `${html.substring(lastEnd, index)}<span class="found foundText">${html.substring(index, index + searchText.length)}</span>`;
                        lastEnd = index + searchText.length;
                        index += 1;
                    }
                } while (index > -1);
                if (lastEnd < html.length) {
                    output += html.substring(lastEnd);
                }
                foundNodes[i].innerHTML = output;
            }
        }
        this.loaded = true;
        return responses;
    },
    setDetailNode: function (responses, header, detailNode) {
        let output = `<h3>${header}:</h3><ul class="detailList">`;
        for (let i = 0; i < responses.length; ++i) {
            output += `<li>${responses[i]}</li>`;
        }
        detailNode.innerHTML = output + '</ul>';
    },
    actions: {
        downloadMessage: function () {
            let hl7Output = '';
            let hl7Node = document.getElementById('hl7MessageDisplay');
            for (let i = 0; i < hl7Node.children.length; ++i) {
                hl7Output += this.getStringFromSegmentDiv(hl7Node.children[i]) + '\r';
            }
            let deleteMe = document.createElement('a');

            deleteMe.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(hl7Output));
            deleteMe.setAttribute('download', 'greatHall HL7 Download.hl7');
            deleteMe.style.display = 'none';
            document.body.appendChild(deleteMe);
            deleteMe.click();
            document.body.removeChild(deleteMe);
        },
        loadMessage: function () {
            if (this.loaded) {
                if (!confirm('The Current Message will be overwritten, continue?')) {
                    return;
                }
            }
            this.hl7Element = document.getElementById('hl7Message');

            let deleteMe = document.createElement('input');
            deleteMe.type = 'file';
            deleteMe.id = 'lookup';
            deleteMe.style.display = 'none';

            deleteMe.addEventListener('change', (e) => {
                let files = e.target.files;
                if (files.length > 0) {
                    let file = files[0];
                    let reader = new FileReader();
                    reader.onload = (() => {
                        return (e) => {
                            this.showMessage(e.target.result);
                        };
                    })(file);
                    reader.readAsText(file);
                }
                else {
                    this.hl7Element.innerHTML = this.getSpan('No File Selected', 'error');
                }
            }, false);
            document.body.appendChild(deleteMe);
            deleteMe.click();
            document.body.removeChild(deleteMe);
        },
        findElements: function () {
            let responses = [];
            //let hl7Node = document.getElementById('hl7MessageDisplay');
            let searchText = document.getElementById('hl7Search').value;
            responses = this.search(searchText, this.hl7Element, false, true);
            this.setDetailNode(responses, `Results of ${searchText}`, document.getElementById('results'));
        },
        toggleWrap: function (val) {
            if (val) {
                this.hl7Element.style.whiteSpace = 'normal';
            } else {
                this.hl7Element.style.whiteSpace = 'nowrap';
            }
        },
        replaceOne: function () {
            this.clearMatch(this.matchNew);
        },
        replaceAll: function () {
            this.loaded = false;
            this.clearMatch(this.matchNew, true);
            let modalNode = document.getElementById('replaceModal');
            modalNode.style.display = 'none';
            let match = this.matchLocations[this.matchLocations.length - 1] + this.matchNew.length;
            let newString = document.getElementById('hl7MessageDisplay').firstChild.innerText;
            do {
                match = newString.toUpperCase().indexOf(this.matchOriginal.toUpperCase(), match);
                if (match !== -1) {
                    let oldVal = newString.substring(match, match + this.matchOriginal.length);
                    let newVal = this.matchCase(oldVal, this.matchNew);
                    newString = newString.substring(0, match) +
                        newVal +
                        newString.substring(match + oldVal.length);
                    match += newVal.length;
                }
            } while (match !== -1);
            this.showMessage(newString);
        },
        skipOne: function () {
            this.clearMatch(this.matchOriginal);
        },
        stopSearch: function () {
            let modalNode = document.getElementById('replaceModal');
            modalNode.style.display = 'none';
            let cancelModal = document.getElementById('cancelModal');
            dragCancel.resetStyle();
            cancelModal.style.display = 'inline-block';
        },
        cancelSearch: function () {
            let cancelModal = document.getElementById('cancelModal');
            cancelModal.style.display = 'none';
            this.loaded = false;
            this.showMessage(this.preMatchMessage);
        },
        keepReplacements: function () {
            let cancelModal = document.getElementById('cancelModal');
            cancelModal.style.display = 'none';
            let foundSpan = document.getElementById('match');
            let newString = document.getElementById('hl7MessageDisplay').firstChild.innerText;
            newString = newString.replace(foundSpan.outerText, this.matchOriginal);
            this.loaded = false;
            this.showMessage(newString);
        },
        continueReplacing: function () {
            let cancelModal = document.getElementById('cancelModal');
            cancelModal.style.display = 'none';
            let modalNode = document.getElementById('replaceModal');
            modalNode.style.display = 'inline-block';
        }
    },
    init: function() {
        this._super();
        
        Ember.$.getJSON("/assets/changes.json", (data) => {        
            let changeList = document.getElementById('changeLog'); 
            let changeHtml = ''                       ;
            for (let i = 0; i < data.length; ++i) {
                let dateItem = `<li>${data[i].date}</li>`;
                let listElements = '';
                for (let j = 0; j < data[i].changes.length; ++j) {
                    listElements += `<li>${data[i].changes[j]}</li>`;
                }
                changeHtml += `${dateItem}<ul>${listElements}</ul>`;
            }
            changeList.innerHTML = changeHtml;
        });
        Ember.$.get("/assets/documentation.html", (data) => {
            document.getElementById('docText').innerHTML = data;
        });
    }
});