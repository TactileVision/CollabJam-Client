<template>
  <v-dialog v-model="dialog" width="800" height="350" persistent>
      <v-container class="h-100" v-if="setupState == SetupState.INIT">
        <v-card  title="Server Setup" class="dialog-card">
          <v-form @submit.prevent="setUsername" v-model="isUsernameValid" ref="setUsername" class="dialog-card">
            <v-card-text>
              <v-row dense>
                <v-col cols="12">
                  <v-text-field
                      label="Username*"
                      v-model="username"
                      :rules="usernameRules"
                      required
                  ></v-text-field>
                </v-col>
              </v-row>
              <small class="text-caption text-medium-emphasis">*indicates required field</small>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                  color="primary"
                  text="Choose Server"
                  variant="tonal"
                  type="submit"
                  :disabled="!isUsernameValid"
              ></v-btn>
            </v-card-actions>
          </v-form>
        </v-card>
      </v-container>
      <v-container class="h-100" v-if="setupState == SetupState.USERNAME">
        <v-card
            title="Server Setup"
            class="dialog-card"
        >
          <v-card-text class="overflow-y-auto">
            <p v-if="servers.length == 0">No servers available.</p>
            <ServerSelectionList
                :username="username"
                :servers="servers"
                :enabled="true"
            ></ServerSelectionList>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
                color="primary"
                icon="mdi-plus"
                variant="tonal"
                type="submit"
                @click="setupState = SetupState.ADD_SERVER"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
      <v-container class="h-100" v-if="setupState == SetupState.ADD_SERVER">
        <!--Server form-->
        <v-card
            v-show="connectionState == ConnectionState.NONE"
            title="Server Setup"
            class="dialog-card"
        >
          <v-form @submit.prevent="submit" v-model="isServerFormValid" ref="addServerForm" class="dialog-card">
            <v-card-text>
              <v-row dense>
                <v-col cols="12" sm="10">
                  <v-text-field
                      label="Address*"
                      v-model="url"
                      :rules="urlRules"
                      required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="2">
                  <v-text-field
                      label="Port"
                      v-model="port"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="10">
                  <v-text-field
                      label="Servername*"
                      v-model="name"
                      :rules="servernameRules"
                      required
                  ></v-text-field>
                </v-col>
              </v-row>
              <small class="text-caption text-medium-emphasis">*indicates required field</small>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                  color="primary"
                  text="Connect"
                  variant="tonal"
                  type="submit"
                  :disabled="!isServerFormValid"
              ></v-btn>
              <v-btn
                  text="Choose Server from list"
                  @click="setupState = SetupState.USERNAME; $refs.addServerForm.reset(); port=3333"
              ></v-btn>
            </v-card-actions>
          </v-form>
        </v-card>
        <!--Spinner-->
        <v-card
            v-if="connectionState == ConnectionState.CONNECTING"
            title="Connecting"
            class="dialog-card"
        >
          <v-card-text class="dialog-card">
            <div class="d-flex justify-center align-center h-100 flex-column" style="gap: 24px">
              <v-progress-circular color="primary" indeterminate :size="36"></v-progress-circular>
              <p>{{connectionInfo}}</p>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
                text="Cancel Connection"
                @click="cancelConnection"
            ></v-btn>
          </v-card-actions>
        </v-card>
        <!--Connection failed-->
        <v-card
            v-if="connectionState == ConnectionState.FAILED"
            title="Connection Failed"
            class="dialog-card"
        >
          <v-card-text class="dialog-card">
            <p class="text-red">Could not establish a connection to Server.</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
                color="primary"
                text="Reconnect"
                variant="tonal"
                @click="connectToServer"
            ></v-btn>
            <v-btn
                text="Edit server"
                @click="connectionState = ConnectionState.NONE"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>

<script lang="ts">
import {defineComponent} from 'vue'
import ServerSelectionList from "@/renderer/components/ServerSelectionList.vue";
import {Room} from "@sharedTypes/roomTypes";
import {useStore} from "@/renderer/store/store";
import {initWebsocket, socket} from "@/main/WebSocketManager";
import {RoomMutations, RoomSettingsActionTypes} from "@/renderer/store/modules/collaboration/roomSettings/roomSettings";
interface Server {
  url: string;
  name: string;
  port: number;
}

enum LocalStorageKey {
  SERVER_LIST = "serverList"
}
enum ConnectionState {
  NONE = "none",
  CONNECTING = "connecting",
  FAILED = "failed"
}

enum SetupState {
  INIT = "init",
  USERNAME = "username",
  ADD_SERVER = "add_server"
}
export default defineComponent({
  name: "ServerWizardView",
  components: {
    ServerSelectionList
  },
  data() {
    return {
      room: null as null | Room,
      username: "",
      store: useStore(),
      servers: [] as { url: string; name: string }[],
      serverList: [] as Server[],
      dialog: true,
      SetupState: SetupState,
      setupState: SetupState.INIT,
      ConnectionState: ConnectionState,
      connectionState: ConnectionState.NONE,
      isUsernameValid: false,
      isServerFormValid: false,
      connectionInfo: null as null | string,
      url: '',
      port: 3333,
      name: '',
      urlRules: [
        (url: string) => {
          if (url) {
            const duplicateServerName: string = this.checkForExistingServerUrl(url);
            if (duplicateServerName != undefined) {
              return `Server-address was already added under the following name: ${duplicateServerName}`;
            }                        
            return true;
          } 
          return 'You must enter a server-address.';          
        },
      ],
      servernameRules: [
        (name: string) => {
          if (name) {
            let isDuplicate = this.checkForExistingServerName(name);
            if (isDuplicate) {
              return 'Server-name was already added.'
            }
            return true
          }
          return 'You must enter a name.';
        },
      ],
      usernameRules: [
        (username: string) => {
          if (username) return true      
          return 'You must enter a username.';
        },
      ]
    }
  },
  methods: {
    setUsername() {
      if (this.isUsernameValid) {
        this.setupState = SetupState.USERNAME;
      }          
    },
    async submit () {
      if (this.isServerFormValid) {
        this.connectToServer();        
      }
    },
    connectToServer(): void {
      this.connectionState = ConnectionState.CONNECTING;
      this.store.dispatch(RoomSettingsActionTypes.setAvailableRoomList, {
        rooms: [],
      });
      let url = this.url;
      if (this.port != 0) {
        url = `${this.url}:${this.port}`;
      }      
      console.log("URL: ", url);
      initWebsocket(this.store, url);
      
      if (socket) { 
        const maxConnectionCount = 3;
        let connectionCount = 1;
        this.connectionInfo = `${connectionCount}/${maxConnectionCount}`;
        
        socket.on('connect', () => {
          console.log("Valid Server")
          this.saveServer();
          this.store.commit(RoomMutations.UPDATE_USER_NAME, this.username);
          this.$router.push("/roomView");
        });
                
        socket.on('connect_error', () => {      
          if (connectionCount == maxConnectionCount) {
            socket?.close();
            console.log("cancel Connection");
            connectionCount = 0;
            this.connectionState = ConnectionState.FAILED;
            return;
          }
          
          console.log("connection failed ", connectionCount, "/", maxConnectionCount);
          connectionCount ++;
          
          this.connectionInfo = `${connectionCount}/${maxConnectionCount}`;
        });
      }
    },
    cancelConnection(): void {
      if (socket) {
        console.log("Closing Socket");
        socket.close();
        this.connectionState = ConnectionState.NONE;
      }
    },
    saveServer(): void {
      const newServer: Server = {
        url: this.url,
        name: this.name !== '' ? this.name : `Server${this.serverList.length + 1}`,
        port: this.port
      };      
      this.serverList.push(newServer);
      localStorage.setItem(LocalStorageKey.SERVER_LIST, JSON.stringify(this.serverList));
      console.log('Added new Server', newServer); 
    },
    loadServerListFromJSON(){
      const savedData = localStorage.getItem(LocalStorageKey.SERVER_LIST);
      if (savedData) {
        this.serverList = JSON.parse(savedData);
        console.log("saved serverList: ", this.serverList);
      } else {
        console.warn("no saved serverList yet");
      }
    },
    checkForExistingServerUrl(url: string): string | undefined {
      const index = this.servers.findIndex((server) => {return server.url == url});
      if (index != -1) {
        return this.servers[index].name;
      }
      return undefined;
    },
    checkForExistingServerName(name: string): boolean {
      return this.servers.some((server) => {return server.name.toLowerCase() == name.toLowerCase()});
    }
  },
  mounted() {
    this.loadServerListFromJSON();
    const serverFromEnv = JSON.parse(import.meta.env.VITE_COLLABJAM_SERVERS || "[]");
    let servers = [] as { url: string; name: string }[];
    
    this.serverList.forEach((server: Server) => {
      servers.push({url: server.url, name: server.name});
    });
    this.servers = servers.concat(serverFromEnv);
    this.username = this.store.state.roomSettings.user.name;
  }
})
</script>

