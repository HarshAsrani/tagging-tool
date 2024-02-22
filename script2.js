let uploadedHtml = null;
let uploadedTagsJson = null;

function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}  
function updateStorage(xpaths, labels, sTexts, texts){
    setStorage('texts', texts);
    setStorage('xpaths', xpaths);
    setStorage('labels', labels);
    setStorage('segmentedTexts', sTexts);
}
var texts = [];
var xpaths = [];
var labels = [];
var sTexts = [];
updateStorage(xpaths, labels, sTexts, texts);

let isMenuOpen = false;
function getStorage(){
    texts = JSON.parse(localStorage.getItem('texts'));
    sTexts = JSON.parse(localStorage.getItem('segmentedTexts'));
    xpaths = JSON.parse(localStorage.getItem('xpaths'));
    labels = JSON.parse(localStorage.getItem('labels'));

    return [xpaths, labels, sTexts, texts];
}


document.addEventListener('DOMContentLoaded', function () {
    // Functionality for uploading HTML file
    document.getElementById('htmlFile').addEventListener('change', function(event) {
      const reader = new FileReader();
      reader.onload = function() {
          uploadedHtml = reader.result;
          // Display the uploaded HTML content
          document.getElementById('htmlDisplay').innerHTML = uploadedHtml;
      };
      reader.readAsText(event.target.files[0]);
  });
    // Functionality for uploading JSON file
    document.getElementById('tagsJsonFile').addEventListener('change', function(event) {
        const reader = new FileReader();
        reader.onload = function() {
            const data = JSON.parse(reader.result);
    
            // Parse JSON arrays from strings
            texts = JSON.parse(data.texts);
            labels = JSON.parse(data.labels);
            xpaths = JSON.parse(data.xpaths);
            sTexts = JSON.parse(data.segmentedTexts);
    
            // Store uploaded data in localStorage
            updateStorage(xpaths, labels, sTexts, texts);
            getStorage();
    
            // Trigger highlighting based on uploaded data
            highlightTextJson(labels, xpaths, texts, sTexts);
        };
        reader.readAsText(event.target.files[0]);
    });
    document.getElementById('tagsMarkupMnAFile').addEventListener('change', function(event) {
        const reader = new FileReader();
    
        reader.onload = function() {
            const data = reader.result;
            console.log(data);
            const csvData = processCSV(data);
            console.log(csvData);

            // const rows = data.split('\r\n'); // Split the CSV into rows
            
            // Start the loop from the second row (index 1) to skip the header
            for (let i = 1; i < csvData.length; i++) {
                const columns = csvData[i];
                let xpath = columns[1];
                let text = columns[2];
                let highlightedXpath = columns[3];
                let highlightedSegmentedText = columns[4];
                let label = columns[5];
                
                if (highlightedXpath) { // Check if highlightedXpath is not empty
                    // Manipulate the xpath string to include 'div[2]' after '/html/body'
                    xpath = xpath.slice(0, 10) + '/div[2]' + xpath.slice(10);
                    
                    // Push the manipulated xpath and other data into respective arrays
                    xpaths.push(xpath);
                    texts.push(text);
                    sTexts.push(highlightedSegmentedText);
                    labels.push(label);
                }
            }
   
            // Store uploaded data in localStorage
            updateStorage(xpaths, labels, sTexts, texts);
            getStorage();
    
            // Trigger highlighting based on uploaded data
            highlightTextMarkupMnA(labels, xpaths, texts, sTexts);
        };
    
        reader.readAsText(event.target.files[0]);
    });
        
    document.getElementById('downloadJson').addEventListener('click', function() {
        downloadObjectAsJson(localStorage, 'contract_saved')
        
      });
    document.getElementById('taggingButton').addEventListener('click', function() {
        // Assume logic for tagging
        [xpaths, labels, sTexts, texts] = getStorage();
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
              event.preventDefault();
              let highlightedText = window.getSelection().toString();
              let selectionRange = window.getSelection().getRangeAt(0);
              let sel = window.getSelection();
              let range = sel.getRangeAt(0);
              let xpaths_text = getElementInfo(sel, range);
              let highlightedXpaths = xpaths_text.xpaths;
              let highlightedSegmentedText = xpaths_text.selectedTexts;
          
          
              if (!isMenuOpen){
                isMenuOpen = true;                
                let sequence = '';
                function handleKeyDown(event) {
                    let allowedKeys = new Set([
                        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
                        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
                        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                        '-', '_'
                    ]);                    
                    if (allowedKeys.has(event.key)) {
                        sequence += event.key;
                    }
                    else if (event.code === 'Space' && sequence.length > 0) {
                        highlightTextSelection(
                            selectionRange,
                            sequence,
                            xpaths.length,
                            xpaths
                        );
                        labels.push(sequence);
                        xpaths.push(highlightedXpaths);
                        sTexts.push(highlightedSegmentedText);
                        texts.push(highlightedText);
                        updateStorage(xpaths, labels, sTexts, texts);
                        sequence = '';
                        // document.body.appendChild(hBox);
                        document.removeEventListener('keydown', handleKeyDown);
                        isMenuOpen = false;
                    }
                    // Reset the sequence if user types something wrong
                    else {
                        sequence = '';
                    }
                }
                document.addEventListener('keydown', handleKeyDown);
              }    
            }
            else if ((event.altKey || event.metaKey) && event.key === "a") {
              let XPathsAndTexts = getAllXPathsAndTexts();
              updateStorage(XPathsAndTexts[1], '', XPathsAndTexts[0], '');
              downloadObjectAsJson(localStorage, 'all_contract_text');
            }
            else if ((event.altKey || event.metaKey) && event.key === "0") {
              updateStorage('', '', '', '');
              console.log('ERASED');
            }
          });
    });
});

function processCSV(text) {
    const csvRows = text.trim().split('\n').map(row => row.replace(/\r$/, ''));
    const csvData = parseCSV(csvRows.join('\n'));
    console.log(csvData);
    checkCSV(csvData);
    // Assuming the CSV has comma-separated values
    // Now you can process the CSV data (e.g., display, parse, etc.)
    console.log("Successfully extract csv text");
    return csvData;
  }
  
  function checkCSV(csvData) {
    // for (let i = 1; i < csvData.length; i++) {
    i = 0
    for (const csvRow of csvData.slice(1)) {
      i++;
      // console.log(csvRow);
      if (csvRow.length < 6 || (csvRow[5] !== "o" && csvRow[3].trim() == "")) {
        console.log(csvRow);
        const paragraph = document.getElementById("visualization-status");
        paragraph.innerHTML = "Fail to visualize. Original CSV file exists error on line "+i;
        paragraph.style.color = "red";
        throw new Error("CSV file exists error.");
      }
    }
  }
    
  function parseCSV(csv) {
      // const regex = /(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g;
      const lines = csv.split('\n');
      const data = [];
    
      for (let i = 0; i < lines.length; i++) {
        const fields = [];
        let inQuotes = false;
        let field = '';
        const row = lines[i];
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            // If it's a comma outside of quotes, push the field
            fields.push(field);
            field = ''; // Reset the field
          } else {
            field += char;
          }
        }
        fields.push(field);
        // const rowMatches = lines[i].match(regex);
        // if (rowMatches) {
        //   const row = rowMatches.map(field => field.trim().replace(/^"(.+)"$/, '$1'));
        //   row.unshift(i);
        //   data.push(row);
        // }
        fields.unshift(i);
        data.push(fields)
      }
      return data;
  }

function downloadObjectAsJson(exportObj, exportName) {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }  

function highlightTextSelection(selectionRange, label, idx, xpaths) {  
    let span = document.createElement('span');
    span.classList.add('highlight');
    span.setAttribute('data-label', label);
    span.setAttribute('data-idx', idx);
    span.setAttribute('data-xpaths', JSON.stringify(xpaths));
    span.style.backgroundColor = 'yellow';
    span.style.cursor = 'pointer';

    // Wrapping the selected text in the span element
    let contents = selectionRange.extractContents();
    span.appendChild(contents);
    selectionRange.insertNode(span);

    // Function to remove highlight
    function removeHighlight(span) {
        [xpaths, labels, sTexts, texts] = getStorage();
        del_idx = span.getAttribute('data-idx');
        texts[del_idx] = 'DEL';
        sTexts[del_idx] = 'DEL';
        xpaths[del_idx] = 'DEL';
        labels[del_idx] = 'DEL';
        updateStorage(xpaths, labels, sTexts, texts);
        while (span.firstChild) {
            span.parentNode.insertBefore(span.firstChild, span);
        }
        span.parentNode.removeChild(span);

    }

    // Toggle highlight selection state
    span.addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent the click from affecting other elements

        // Toggle selection visual feedback
        const isSelected = span.getAttribute('data-selected') === 'true';
        if (!isSelected) {
            span.setAttribute('data-selected', 'true');
            span.style.border = '2px solid red';
            
            // Optionally, open a dialog for deletion here or directly call removeHighlight
            if (confirm("Delete this highlight?")) { // Simple confirmation for demonstration
                removeHighlight(span);
            } else {
                // If not deleting, just deselect
                span.setAttribute('data-selected', 'false');
                span.style.border = '';
            }
        } else {
            span.setAttribute('data-selected', 'false');
            span.style.border = '';
        }
    });

    // Clear the selection after highlighting
    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
    // return span;
}
function getElementInfo(sel, range) {
    const container = range.commonAncestorContainer;
    const nodeXPaths = [];
    const nodeTexts = [];
    let currSelectCopy = sel.toString().trim();
  
    function getXPath(node) {
      let xpath = "";
      for (; node && node.nodeType == Node.ELEMENT_NODE; node = node.parentNode) {
        let siblings = Array.from(node.parentNode.childNodes).filter(
          (sibling) => sibling.nodeName === node.nodeName
        );
        if (siblings.length > 1) {
          let index = siblings.indexOf(node) + 1;
          xpath = `/${node.nodeName.toLowerCase()}[${index}]${xpath}`;
        } else {
          xpath = `/${node.nodeName.toLowerCase()}${xpath}`;
        }
      }
      return xpath;
    }
  
    function traverse(node) {
      if (range.intersectsNode(node)) {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent.trim().length > 0) {
            let nodeXPath = getXPath(node.parentNode);
            let nodeText = node.textContent.trim();
            let startIndex = Math.max(nodeText.indexOf(currSelectCopy), 0);
            let endIndex = Math.min(
              startIndex + currSelectCopy.length,
              nodeText.length
            );
            if (startIndex !== -1) {
              let selectedText = nodeText.substring(startIndex, endIndex);
              currSelectCopy = currSelectCopy.replace(selectedText, "");
              nodeTexts.push(selectedText);
              nodeXPaths.push(nodeXPath);
            }
          }
        } else {
          if (node.childNodes.length > 0) {
            for (let i = 0; i < node.childNodes.length; i++) {
              traverse(node.childNodes[i]);
            }
          } else {
            if (node.textContent.trim().length > 0) {
              let nodeXPath = getXPath(node);
              let nodeText = node.textContent.trim();
              let startIndex = Math.max(nodeText.indexOf(currSelectCopy), 0);
              let endIndex = Math.min(
                startIndex + currSelectCopy.length,
                nodeText.length
              );
              if (startIndex !== -1) {
                let selectedText = nodeText.substring(startIndex, endIndex);
                currSelectCopy = currSelectCopy.replace(selectedText, "");
                nodeTexts.push(selectedText);
                nodeXPaths.push(nodeXPath);
              }
            }
          }
        }
      }
    }
  
    traverse(container);
  
    return { xpaths: nodeXPaths, selectedTexts: nodeTexts };
  }


  function highlightTextJson(labels, xpaths, texts, sTexts) {
    for (let idx = 0; idx < xpaths.length; idx++) {
        for (let xpath_idx = 0; xpath_idx < xpaths[idx].length; xpath_idx++) {
            const xpath = xpaths[idx][xpath_idx];
            const targetElements = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            
            if (targetElements) {
                for (let i = 0; i < targetElements.snapshotLength; i++) {
                    const targetElement = targetElements.snapshotItem(i);
                    const textNodes = getTextNodes(targetElement);
                    
                    textNodes.forEach(node => {
                        const span = document.createElement('span');
                        span.classList.add('highlight');
                        span.setAttribute('data-label', labels[idx]);
                        span.setAttribute('data-idx', idx);
                        span.setAttribute('data-xpaths', JSON.stringify(xpath));
                        span.style.backgroundColor = 'yellow';
                        span.style.cursor = 'pointer';
                        span.innerText = node.textContent; // Set the text content of the node
                    
                        // Function to remove highlight
                        function removeHighlight(span) {
                            // Get the original text content and replace the span element with it
                            const originalText = span.innerText;
                            const parentElement = span.parentNode;
                            parentElement.replaceChild(document.createTextNode(originalText), span);
                            [xpaths, labels, sTexts, texts] = getStorage();
                            del_idx = span.getAttribute('data-idx');
                            texts[del_idx] = 'DEL';
                            sTexts[del_idx] = 'DEL';
                            xpaths[del_idx] = 'DEL';
                            labels[del_idx] = 'DEL';
                            updateStorage(xpaths, labels, sTexts, texts);
                    
                            // Optionally, update your storage and any other necessary operations here
                        }
                    
                        // Toggle highlight selection state
                        span.addEventListener('click', function(event) {
                            event.stopPropagation(); // Prevent the click from affecting other elements
                        
                            // Toggle selection visual feedback
                            const isSelected = span.getAttribute('data-selected') === 'true';
                            if (!isSelected) {
                                span.setAttribute('data-selected', 'true');
                                span.style.border = '2px solid red';
                        
                                // Optionally, open a dialog for deletion here or directly call removeHighlight
                                if (confirm("Delete this highlight?")) { // Simple confirmation for demonstration
                                    removeHighlight(span); // Pass the span element to removeHighlight function
                                } else {
                                    // If not deleting, just deselect
                                    span.setAttribute('data-selected', 'false');
                                    span.style.border = '';
                                }
                            } else {
                                span.setAttribute('data-selected', 'false');
                                span.style.border = '';
                            }
                        });
                    
                        // Replace the text node with the span
                        node.parentNode.replaceChild(span, node);
                    });
                }
            } else {
                console.error("Element not found for xpath: ", xpath);
            }
        }
    }
}

function highlightTextMarkupMnA(labels, xpaths, texts, sTexts) {
    for (let idx = 0; idx < xpaths.length; idx++) {
                    const xpath = xpaths[idx];
            const targetElements = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            
            if (targetElements) {
                for (let i = 0; i < targetElements.snapshotLength; i++) {
                    const targetElement = targetElements.snapshotItem(i);
                    const textNodes = getTextNodes(targetElement);
                    
                    textNodes.forEach(node => {
                        const span = document.createElement('span');
                        span.classList.add('highlight');
                        span.setAttribute('data-label', labels[idx]);
                        span.setAttribute('data-idx', idx);
                        span.setAttribute('data-xpaths', JSON.stringify(xpath));
                        span.style.backgroundColor = 'yellow';
                        span.style.cursor = 'pointer';
                        span.innerText = node.textContent; // Set the text content of the node
                    
                        // Function to remove highlight
                        function removeHighlight(span) {
                            // Get the original text content and replace the span element with it
                            const originalText = span.innerText;
                            const parentElement = span.parentNode;
                            parentElement.replaceChild(document.createTextNode(originalText), span);
                            [xpaths, labels, sTexts, texts] = getStorage();
                            del_idx = span.getAttribute('data-idx');
                            texts[del_idx] = 'DEL';
                            sTexts[del_idx] = 'DEL';
                            xpaths[del_idx] = 'DEL';
                            labels[del_idx] = 'DEL';
                            updateStorage(xpaths, labels, sTexts, texts);
                    
                            // Optionally, update your storage and any other necessary operations here
                        }
                    
                        // Toggle highlight selection state
                        span.addEventListener('click', function(event) {
                            event.stopPropagation(); // Prevent the click from affecting other elements
                        
                            // Toggle selection visual feedback
                            const isSelected = span.getAttribute('data-selected') === 'true';
                            if (!isSelected) {
                                span.setAttribute('data-selected', 'true');
                                span.style.border = '2px solid red';
                        
                                // Optionally, open a dialog for deletion here or directly call removeHighlight
                                if (confirm("Delete this highlight?")) { // Simple confirmation for demonstration
                                    removeHighlight(span); // Pass the span element to removeHighlight function
                                } else {
                                    // If not deleting, just deselect
                                    span.setAttribute('data-selected', 'false');
                                    span.style.border = '';
                                }
                            } else {
                                span.setAttribute('data-selected', 'false');
                                span.style.border = '';
                            }
                        });
                    
                        // Replace the text node with the span
                        node.parentNode.replaceChild(span, node);
                    });
                }
            } else {
                console.error("Element not found for xpath: ", xpath);
            }
    }
}

// Function to retrieve text nodes from an element
function getTextNodes(node) {
    const textNodes = [];
    const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
    let currentNode;
    while (currentNode = walk.nextNode()) {
        textNodes.push(currentNode);
    }
    return textNodes;
}
