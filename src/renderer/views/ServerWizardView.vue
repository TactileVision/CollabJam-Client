<template>
  <v-navigation-drawer width="150">
    <v-container>
      <h6 class="text-h6">Server</h6>
    </v-container>
    <ServerSelectionList
        :username="username"
        :servers="servers"
        :enabled="username != ''"
    ></ServerSelectionList>
    <template #append>
      <v-container class="d-flex justify-center">
        <!--Add server setup-->
        <v-dialog max-width="600" height="350">
          <template #activator="{ props: activatorProps }">
            <v-btn
                :disabled="username == ''"
                v-bind="activatorProps"
                icon="mdi-plus"
                variant="tonal"
                @click="connectionState = ConnectionState.NONE;">
            </v-btn>
          </template>
          <template #default="{ isActive }">
            <v-card
                v-show="connectionState == ConnectionState.NONE"
                title="Server Setup"
                class="h-100"
            >
              <v-form @submit.prevent="submit" v-model="isValid" ref="addServerForm">
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
                          :rules="nameRules"
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
                  ></v-btn>
                  <v-btn
                      text="Close Dialog"
                      @click="isActive.value = false; $refs.addServerForm.reset();"
                  ></v-btn>
                </v-card-actions>
              </v-form>
            </v-card>
            <v-card
                v-if="connectionState == ConnectionState.CONNECTING"
                title="Connecting"
                class="h-100"
            >
              <v-card-text>
                <div class="d-flex justify-center align-center h-100">
                  <v-progress-circular color="primary" indeterminate :size="36"></v-progress-circular>
                </div>              
              </v-card-text>
            </v-card>
            <v-card
                v-if="connectionState == ConnectionState.FAILED"
                title="Connection Failed"
                class="h-100"
            >
              <v-card-text>
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
                    text="Close Dialog"
                    @click="isActive.value = false; $refs.addServerForm.reset();"
                ></v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>
      </v-container>
    </template>
  </v-navigation-drawer>
  <ServerUserSetup
      v-model="username"
      :inputs-disabled="false"
  ></ServerUserSetup>
  <v-alert type="warning" variant="tonal">
    Select a server to start Jamming
  </v-alert>
</template>

<style scoped lang="scss">

</style>

<script lang="ts">
import {defineComponent} from 'vue'
import ServerSelectionList from "@/renderer/components/ServerSelectionList.vue";
import {Room} from "@sharedTypes/roomTypes";
import {useStore} from "@/renderer/store/store";
import ServerUserSetup from "@/renderer/components/ServerUserSetup.vue";
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
export default defineComponent({
  name: "ServerWizardView",
  components: {
    ServerUserSetup,
    ServerSelectionList
  },
  data() {
    return {
      room: null as null | Room,
      username: "",
      store: useStore(),
      servers: [] as { url: string; name: string }[],
      serverList: [] as Server[],
      ConnectionState: ConnectionState,
      connectionState: ConnectionState.NONE, 
      isValid: false,
      url: '',
      port: 3333,
      name: '',
      urlRules: [
        (url: string) => {
          if (url) {
            const isDuplicate = this.checkForExistingServerUrl(url);
            if (isDuplicate) {
              return 'Server-address was already added.'
            }        
            
            return true;
          } else {
            return 'You must enter a server-address.';
          }
        },
      ],
      nameRules: [
        // needs to be unique?
        (name: string) => {
          if (name) return true

          return 'You must enter a name.';
        },
      ]
    }
  },
  methods: {
    async submit () {
      if (this.isValid) {
        console.log("try connecting to: ", {
          url: this.url,
          port: this.port,
          name: this.name
        });
        this.connectToServer();        
      }
    },
    connectToServer(): void {
      this.connectionState = ConnectionState.CONNECTING;
      this.store.dispatch(RoomSettingsActionTypes.setAvailableRoomList, {
        rooms: [],
      });
      initWebsocket(this.store, this.url);
      
      if (socket) { 
        const maxConnectionCount = 3;
        let connectionCount = 1;
        
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
        });
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
    checkForExistingServerUrl(url: string): boolean {
      return this.servers.some((server) => {return server.url == url});
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
  }
})
</script>

