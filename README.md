# TactileCollab
A tool that enables real-time collaboration when deisgning vibrotactile experiences.


## Prerequisites

This version was tested with NodeJS **v14.18.2**. Make sure to install the same version on your computer. You can easliy install or change the active Node version with a version manager like [NVM](https://github.com/nvm-sh/nvm) or [N](https://www.npmjs.com/package/n). Please read the dedicated documentation how to do that.

Clone the repository on your computer, e.g. `git clone https://github.com/TactileVision/TactileCollab.git`



## Frontend

### How to Install
1. Inside the repository, navigate to `frontend`
2. Execute `npm install`
    - If an error related to *electron modules* occures, you need to remove all folders containing "electron" in the name inside of the `node_modules` folder.
    - Execute `npm install` once more
3. **Only for Windows users:** check the `node_modules/abandonware/noble` for other requiered packages

### How to Run
**NOTE:** For windows you need a bluetooth-dongle, which use the WinUsb Driver (for flashing Bluetooth Adapter use zadig). Before you start the frontend, make sure that the bluetooth-dongle is connected to your computer with the correct driver and that it's currently not used.

**NOTE:** If the server doesn't run on the same computer you need to set the server IP address in `frontend\src\renderer\CommunicationManager\WebSocketManager\index.ts`

1. Inside the repository, navigate to `frontend`
2. Execute `npm run electron:serve`




## Backend

### How to Install
1. Inside the repository, navigate to `backend`
2. Execute `npm install`

### How to Run
1. Inside the repository, navigate to `backend`
2. Execute `npm run serve`
