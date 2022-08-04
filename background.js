// updating the context menu on installation
chrome.runtime.onInstalled.addListener(()=>{
    refreshMenu();
})

// Onclick listener for the context menu
chrome.contextMenus.onClicked.addListener((data)=>{
    // get the id of the menu item
    let itemId = data.menuItemId;
    chrome.storage.sync.get('dataArray', response=>{
        // Identify the target path
        let labels = response.dataArray.map(value => value.label);
        let targetPath = response.dataArray[labels.indexOf(itemId)];
        // get the path data
        let baseUrl = targetPath.baseUrl;
        let prefix = targetPath.prefix;
        let suffix = targetPath.suffix;
        // Construct the path TODO: complete this with the selected value
        let path = baseUrl + '/' + prefix + data.selectionText + suffix;
        newTab(path)
        
    })
})


// Watching for changes in dataArray
// TODO: use this service worker to update the ui aswell
chrome.storage.onChanged.addListener((changes, namespace)=>{
    for(let [key, {oldValue, newValue}] of Object.entries(changes)){
        if(key=="dataArray"){ 
           chrome.runtime.sendMessage({msg:'updateUi'});
            // Check if the new value is undefined or empty
            if(!newValue || newValue.length == 0){
                // Clear the context menu
                chrome.contextMenus.removeAll();
            }else{
                // Check if oldValue is an empty array : throws typeError when executing map
                if(!oldValue){
                    newValue.forEach(path=>{
                        addToMenu(path);
                    })
                    return
                }
                // Identify the updated value, using the labels since they serve as unique id
                let oldLabels = oldValue.map((value)=> value.label)
                let newLabels = newValue.map((value)=> value.label)

                // first : we check for deleted values
                let deletedValues = oldLabels.filter(value=> !newLabels.includes(value));
                // Delete these elements from the context value 
                deletedValues.forEach(label => {
                    deleteFromMenu(label)
                });

                // second : we check for new values :
                let newValues = newLabels.filter(value=> !oldLabels.includes(value));
                // Add these elements to the context menu
                newValues.forEach(label => {
                    addToMenu(newValue[newLabels.indexOf(label)]);  
                });

                // third : we check updated values in the intersection
                let commonValues = newLabels.filter(value=> oldLabels.includes(value));
                // Check which of these values have been changed
                let updatedValues = commonValues.filter(value=>areEquale(oldValue[oldLabels.indexOf(value)], newValue[newLabels.indexOf(value)]))
                // then we update these values
                updatedValues.forEach(label => {
                    updateInMenu(newValue[newLabels.indexOf(label)]);
                });
            }
            // if not start clear the old context menu and start populating it again
        }
    }
})

// Watching for messages :
chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
    // updating the context menu
    if(message.action == "updateMenu"){
        refreshMenu();
        sendResponse(true)
        
    }else if(message.action == "remove"){
        chrome.storage.sync.get('dataArray', response=>{
            let data = response.dataArray;
            data = data.filter(elm => elm.label != message.data)
            chrome.storage.sync.set({'dataArray' : data}, ()=>{
                return true
            })
            return true
        })
        sendResponse(true)
    }
})


// || Helper functions

//populate the contextmenu on launch
function refreshMenu(){
    // first get all stored data
    chrome.storage.sync.get('dataArray', data=>{
        // Check if the dataArray is undefined
        if(!data.dataArray){return}
        // once the data hase been recieved, first clear the old context Menu
        chrome.contextMenus.removeAll(()=>{
            // then we add each element one by one : 
            data.dataArray.forEach(path=>{
            addToMenu(path);
        })
        });

    })
}

// Delete an element from the context menu Identified by the label
function deleteFromMenu(label){
    chrome.storage.sync.get('dataArray', response=>{
        if(!response.dataArray){return}
        chrome.contextMenus.remove(label)
        
    })
}

// Add an element to the context menu
function addToMenu(path){
    chrome.contextMenus.create(
        {
            "id"      : path.label,
            "title"   : path.label,
            "contexts" : ["selection"]
        },
        ()=>{
        }
    )
}


// update an element to the context menu
function updateInMenu(path){
    // TODO: complete
}


// compare two objects (path objects)
function areEquale(obj1, obj2){
    for(let property in obj1){
        if(obj1[property]!=obj2[property]){
            return false;
        }
    }
    return true
}

// Open url in a new tab
function newTab(path) { 
    chrome.tabs.create({url: path})
}