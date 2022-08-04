// popup.js

// allows to retrieve user data concerning predefind URLs
// also allows to modify or add a new url option

// Allows to update ui on every launch
fetchData();

// On message listener
chrome.runtime.onMessage.addListener(msg=>{
    if(msg.msg=='updateUi'){
        fetchData();
    }
})


// TODO: remove and modify buttons event listeners

// fetching ui elements
let landingDiv = document.querySelector(".landing-div");
let listContainer = document.querySelector(".list-container");
let addItemForm = document.querySelector(".form__add-item");
let addBtn = document.querySelector(".btn__add-item");
let returnBtn = document.querySelector(".btn__return");
let confirmBtn = document.querySelector(".btn__confirm");
let previewTxt = document.querySelector(".preview__txt");
// getting form elements
let labelFld = document.querySelector("#label");
let baseUrlFld = document.querySelector("#base-url");
let prefixFld = document.querySelector("#prefix");
let suffixFld = document.querySelector("#suffix");

// Init values
var labelValue = "";
var baseUrlValue = "";
var prefixValue = "";
var suffixValue = "";


// TODO: Add code to fetch data
// using an empty array for testing purposes

// Populating the items list with data
// fetchData();

// Sending a message to the service worker to populate to context menu
chrome.runtime.sendMessage({action: "updateMenu"})




// add button listener
addBtn.addEventListener("click", ()=>{
    showForm();
})
// return button listener
returnBtn.addEventListener("click", ()=>{
    showLandingDiv()
})
// confirmBtn listener
confirmBtn.addEventListener("click", ()=>{
    // Assert that the form is valid
    if(!isFormValid()){return}
    // Get the data as an object
    let inputData = {
        label : labelValue,
        baseUrl : baseUrlValue,
        prefix : prefixValue,
        suffix : suffixValue
    }
    // Acces the sync storage
    chrome.storage.sync.get('dataArray', data=>{
        let dataArray = data.dataArray;
        // Get a list of all labels to check wether the label is available or not
        let labels = [];
        if(typeof dataArray != "undefined"){    // Checking if dataArray is undefined, which is true when adding the first element to storage
            labels = dataArray.map(elm=>elm.label);
        }

        if(labels.includes(inputData.label)){    
            /*  Here the label already exists in the storage
            *   Which can either be due to the user trying to change an element   
            *   Or him chosing an already used label by mistake
            */
            if(confirm('An element with this label already exists, are you sure you want to override changes ?')){
                // User confirms : Update the element in the dataArray
                dataArray[labels.indexOf(inputData.label)] = inputData;
                chrome.storage.sync.set({"dataArray" : dataArray}, ()=>{
                    clearInputs();      // Clear the inputs in the form
                    fetchData();        // to fetch and update the ui in the landing page
                    showLandingDiv();   // Switch view to landing div
                })
            }else{
                // User cancels
                clearInputs();
                showLandingDiv();
            }
        }else{
            // Here the label is not used, so we push the input object to the dataArray and we set in in the storage
            // Checking for an undefined dataArray
            if(typeof dataArray != 'undefined'){
                dataArray.push(inputData);
            }else{
                dataArray = [inputData];
            }
            chrome.storage.sync.set({"dataArray" : dataArray}, ()=>{
                clearInputs();      // Clear the inputs in the form
                fetchData();        // to fetch and update the ui in the landing page
                showLandingDiv();   // Switch view to landing div
            })
        }

    })
})
// form elements change event
labelFld.addEventListener("input", updateValues)
baseUrlFld.addEventListener("input", updateValues)
suffixFld.addEventListener("input", updateValues)
prefixFld.addEventListener("input", updateValues)



// |||||||| helper functions

// Navigating views :
function showLandingDiv(){
    landingDiv.classList.remove("inactive");
    addItemForm.classList.add("inactive");
}

function showForm(){
    landingDiv.classList.add("inactive");
    addItemForm.classList.remove("inactive");
}

// fetch data and updating the landing content ui
function fetchData(){
    chrome.storage.sync.get(['dataArray'], (result)=>{
        updateUI(result.dataArray);
    }) 
}

function updateUI(data){
    // If the data set is empty: display "No items to display"
    listContainer.innerHTML = "";                      // Reset ui
    if(!data || data.length===0){
        let emptyListText = document.createElement("div");
        emptyListText.classList.add("card")
        emptyListText.innerText = "No items to display";
        listContainer.appendChild(emptyListText);
    }else{
        buildUI(data)
    }
}

// Building the ui from data : Populating the items list container with cards
function buildUI(data){
     
    /*  
        *   TODO: Give sementice importance to the preview since it will be the only element displaying all the data
    */
    data.forEach(elm => {
        // Card element
        let card = document.createElement("div")
        card.classList.add("card");
        
        // Label
        let label = document.createElement('div');
        label.classList.add("card__label");
        label.innerText = elm.label;

        // Base URL 
        let baseUrl = document.createElement('div');
        baseUrl.classList.add('card__baseUrl');

        let baseUrlLink = document.createElement('a');
        baseUrlLink.classList.add('card__baseUrl__link');
        baseUrlLink.setAttribute('href', elm.baseUrl);
        baseUrlLink.innerText = elm.baseUrl;

        baseUrl.appendChild(baseUrlLink);

        // Preview
        let preview = document.createElement('div');
        preview.classList.add('card__preview');
        preview.innerText = elm.baseUrl + "/" + elm.prefix + "XXXXXX" + elm.suffix;

        let btnsContainer = document.createElement('div');
        btnsContainer.classList.add('card__btns-container');

        let modifyBtn = document.createElement('div');
        modifyBtn.classList.add('btn','btn--modify');
        modifyBtn.innerText = "Modify";
        modifyBtn.addEventListener('click', ()=>{
            modify(elm.label);
        })

        let removeBtn = document.createElement('div');
        removeBtn.classList.add('btn','btn--remove');
        removeBtn.innerText = "Remove";
        removeBtn.addEventListener('click', ()=>{
            remove(elm.label)})

        btnsContainer.appendChild(modifyBtn);
        btnsContainer.appendChild(removeBtn);

        card.appendChild(label);
        card.appendChild(baseUrl);
        card.appendChild(preview);
        card.appendChild(btnsContainer);

        listContainer.appendChild(card);

    });
}

// Removing an element from the datasen and the ui
function remove(label){
    // send a message to the background to remove the element
    chrome.runtime.sendMessage({action: "remove", data: label}, ()=>{
        fetchData();
    })
}

// Modifying an element in the form
function modify(label){
    // First we fetch all the data for the target element
    chrome.storage.sync.get('dataArray', data=>{
        let dataArray = data.dataArray;
        let labels = dataArray.map(elm=>elm.label);
        let targetData = dataArray[labels.indexOf(label)];

        openModifyForm(targetData);
    })

    // chrome.runtime.sendMessage({action: "modify", data: label}, ()=>{
    // })
}

// Open form with data from a target path
function openModifyForm(element){
    // Toggle the form
    showForm();
    // Fill form elements with data
    labelFld.value = element.label;
    baseUrlFld.value = element.baseUrl;
    prefixFld.value = element.prefix;
    suffixFld.value = element.suffix;
    // update values
    updateValues();
}

// Validate form

function isFormValid(){
    // Checks if a form is valid upon clicking the confirm button

    // Asserting that the label and the baseUrl are not empty
    if(baseUrlValue=="" || labelValue==""){
        alert('Please fill all required fields')
        return false}

    // Asserting that the base url is a valid
    if(!isValidUrl(baseUrlValue)) {     
        alert('Please enter a valid base url')   
        return false
    }
    return true
}

// Check if a user input url is a valid url
function isValidUrl(url){
    let urlStr;
    try {
        urlStr = new URL(url)
    } catch (error) {
        return false;
    }
    return true;
}

// Updating input variables and the preview
function updateValues(){
    labelValue = labelFld.value;
    baseUrlValue = baseUrlFld.value;
    prefixValue = prefixFld.value;
    suffixValue = suffixFld.value;

    updatePreview();

}

// preview 
function updatePreview(){
    // Updates the preview upon changing the values of the suffix or the baseUrl
    // Removes it if both values are empty and always if the base url value is empty

    previewTxt.innerText = ""

    if(baseUrlValue=="" && suffixValue=="" && prefixValue==""){
        previewTxt.classList.add("inactive")
        return
    }
    if(baseUrlValue==""){
        previewTxt.classList.add("inactive")
        return
    }
    previewTxt.classList.remove("inactive")
    let previewStr =labelValue + " : " + baseUrlValue + "/" + prefixValue + "XXXX" +  suffixValue;
    previewTxt.innerText = previewStr

}

// clearing values in flds

function clearInputs(){
    labelFld.value = "";
    baseUrlFld.value="";
    prefixFld.value="";
    suffixFld.value=""
}