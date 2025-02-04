# CollabJam: Client Application

![CollabJam-v1 1 0-GUI](https://github.com/user-attachments/assets/17c76216-11b3-40f8-92fc-921dc8d8d3f0)


## Related Repositories

Below are links to the individual repositories associated with the project:

- ⭐️ [Meta Repository](https://github.com/TactileVision/CollabJam) - The main repository.
- ⚙️ [Server Repository](https://github.com/TactileVision/CollabJam-Server) - The server application used for collaborative designing, shared rendering of vibrotactile patterns, and storing patterns in a database.
- ⚙️ [Share Components Repository](https://github.com/TactileVision/CollabJam-Shared) - Components which are shared across the server and client application.
- ⚙️ [Firmware Repository](https://github.com/TactileVision/CollabJam-Firmware) - Contains the firmware code for the tactile display used in the project.
- 🕹️ [Hardware Repository](https://github.com/TactileVision/CollabJam-PCB) - Detailed schematics and designs for the tactile display.
- 📈 [Data Visualization Repository](https://github.com/TactileVision/CollabJam-Tacton-Table-Tool) - Tool for visualizing vibrotactile patterns collected during the study sessions.


## Citation

If you use this project in your research, please cite it as follows:

```bibtex
@inproceedings{Wittchen2025CollabJam,
    author = {Wittchen, Dennis and Ramian, Alexander and Sabnis, Nihar and Chlebowski, Christopher and Böhme, Richard and Freitag, Georg and Fruchard, Bruno and Degraen, Donald},
    title = {CollabJam: Studying Collaborative Haptic Experience Design for On-Body Vibrotactile Patterns},
    year = {2025},
    publisher = {Association for Computing Machinery},
    address = {New York, NY, USA},
    booktitle = {Proceedings of the 2025 CHI Conference on Human Factors in Computing Systems},
    location = {Yokohama, Japan},
    series = {CHI '25},
    doi = {10.1145/3706598.3713469}
}
```



## Project setup

```
npm install
```

### Configure environment variables

The default configuration uses a local server for development. To use a different server, set the `VITE_COLLABJAM_SERVERS` environment variable. Therefore, create a `.env` file in the root directory. The variable should be a JSON array of objects with the keys `url` and `name`.

Example:
```
VITE_COLLABJAM_SERVERS='[
  {"url": "ws://localhost:3333/", "name": "Local"},
  {"url": "https://your.server/", "name": "SERVER 1"},
  {"url": "https://192.0.0.1/", "name": "SERVER 2"}
]'
```


### Compiles and hot-reloads for development

```
npm run dev
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run format
```
