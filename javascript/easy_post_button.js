onUiLoaded(async () => {
  const app = gradioApp();
  // initial settings
  [
    `https://cdnjs.cloudflare.com/ajax/libs/dropbox.js/10.34.0/Dropbox-sdk.min.js`,
    `https://cdn.jsdelivr.net/npm/async-lock@1.4.0/lib/index.js`,
  ].forEach((src) => document.head.appendChild(EPBElementBuilder.script(src)));

  // create post buttons
  [
    [`txt2img_actions_column`, `#txt2img_gallery button.selected img`],
    [`img2img_actions_column`, `#img2img_gallery button.selected img`],
    [`extras_results`, `#extras_gallery button.selected img`],
  ].forEach(([appendTargetId, postImgQuery]) => {
    const appendTarget = app.getElementById(appendTargetId);
    appendTarget.appendChild(
      EPBElementBuilder.dropboxPostButton(`POST Dropbox`, postImgQuery)
    );
  });

  // create settings tab buttons
  const setting_epb_dropbox_client_secret = app.getElementById(
    EPBSettings.dropbox_client_secret
  );
  setting_epb_dropbox_client_secret.appendChild(
    EPBElementBuilder.dropboxAuthCodeButton(`GET Dropbox Auth Code`)
  );

  const setting_epb_dropbox_refreshtoken = app.getElementById(
    EPBSettings.dropbox_refresh_token
  );
  setting_epb_dropbox_refreshtoken.appendChild(
    EPBElementBuilder.dropboxTokenButton(`GET Dropbox Token`)
  );
});

class WebAPI {
  static async getBlobFile(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return blob;
  }
}

class EPBSettings {
  static dropbox_client_id = "setting_epb_dropbox_client_id";
  static dropbox_client_secret = "setting_epb_dropbox_client_secret";
  static dropbox_auth_code = "setting_epb_dropbox_auth_code";
  static dropbox_access_token = "setting_epb_dropbox_access_token";
  static dropbox_refresh_token = "setting_epb_dropbox_refresh_token";

  static getClientId() {
    return EPBSettings.getValue(EPBSettings.dropbox_client_id);
  }
  static getClientSecret() {
    return EPBSettings.getValue(EPBSettings.dropbox_client_secret);
  }
  static getAuthCode() {
    return EPBSettings.getValue(EPBSettings.dropbox_auth_code);
  }
  static getAccessToken() {
    return EPBSettings.getValue(EPBSettings.dropbox_access_token);
  }
  static getRefreshToken() {
    return EPBSettings.getValue(EPBSettings.dropbox_refresh_token);
  }

  static setClientId(newValue) {
    EPBSettings.setValue(EPBSettings.dropbox_client_id, newValue);
  }
  static setClientSecret(newValue) {
    EPBSettings.setValue(EPBSettings.dropbox_client_secret, newValue);
  }
  static setAuthCode(newValue) {
    EPBSettings.setValue(EPBSettings.dropbox_auth_code, newValue);
  }
  static setAccessToken(newValue) {
    EPBSettings.setValue(EPBSettings.dropbox_access_token, newValue);
  }
  static setRefreshToken(newValue) {
    EPBSettings.setValue(EPBSettings.dropbox_refresh_token, newValue);
  }

  static getValue(id) {
    return gradioApp().querySelector(`#${id} textarea`).value;
  }

  static setValue(id, newValue) {
    const textarea = gradioApp().querySelector(`#${id} textarea`);
    textarea.value = newValue;
    updateInput(textarea);
  }
}

class EPBElementBuilder {
  static script(src) {
    const script = document.createElement(`script`);
    script.src = src;
    return script;
  }

  static button(title, onClick) {
    const button = document.createElement(`button`);
    button.innerHTML = title;
    button.classList.add(
      `gradio-button`,
      `svelte-1ipelgc`,
      `gr-button-sm`,
      `gr-button-secondary`,
      `sm`,
      `secondary`
    );
    button.style = "margin-top: 0.5rem;";
    button.addEventListener(`click`, onClick);
    return button;
  }

  static dropboxPostButton(title, selectedImgQuery) {
    return EPBElementBuilder.button(title, (event) => {
      const button = event.target;

      EPBElementBuilder.invokeAysncButton(button, "Sending...", async () => {
        const selectedImg = gradioApp().querySelector(selectedImgQuery);
        const blob = await WebAPI.getBlobFile(selectedImg.src);

        const dbx = new Dropbox.Dropbox({
          clientId: EPBSettings.getClientId(),
          clientSecret: EPBSettings.getClientSecret(),
          accessToken: EPBSettings.getAccessToken(),
          refreshToken: EPBSettings.getRefreshToken(),
        });

        const filePath = new URL(selectedImg.src).pathname.split("file=")[1];
        return dbx
          .filesUpload({
            path: filePath,
            contents: blob,
          })
          .then((response) => {
            console.log(`File uploaded ${response}`);
          });
      });
    });
  }

  static dropboxAuthCodeButton(title) {
    return EPBElementBuilder.button(title, () => {
      const clientId = EPBSettings.getClientId();
      const width = 800;
      const height = 800;
      const wleft = window.screen.width / 2 - width / 2;
      const wtop = window.screen.height / 2 - height / 2;
      const url = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=code&token_access_type=offline`;
      const options = `width=${width}, height=${height}, top=${wtop}, left=${wleft}`;

      window.open(url, "Dropbox Authentication", options);

      EPBSettings.setAuthCode("");
      EPBSettings.setAccessToken("");
      EPBSettings.setRefreshToken("");
    });
  }

  static dropboxTokenButton(title) {
    return EPBElementBuilder.button(title, async (event) => {
      const button = event.target;

      EPBElementBuilder.invokeAysncButton(button, "Sending...", () => {
        const dbx = new Dropbox.Dropbox({
          clientId: EPBSettings.getClientId(),
          clientSecret: EPBSettings.getClientSecret(),
        });

        return dbx.auth
          .getAccessTokenFromCode(null, EPBSettings.getAuthCode())
          .then((response) => {
            const accessToken = response.result.access_token;
            const refreshToken = response.result.refresh_token;
            console.log(`Access token:`, accessToken);
            console.log(`Refresh token:`, refreshToken);
            EPBSettings.setAccessToken(accessToken);
            EPBSettings.setRefreshToken(refreshToken);
          });
      });
    });
  }

  static async invokeAysncButton(button, processingTitle, asyncButtonProcess) {
    const lock = new AsyncLock();
    const oldInnerHTML = button.innerHTML;
    await lock.acquire("invokeAsyncButton", async () => {
      try {
        button.disabled = true;
        button.innerHTML = processingTitle;

        await asyncButtonProcess();
      } catch (error) {
        alert(`Process Failed ${error}`);
        console.error(error);
      } finally {
        button.innerHTML = oldInnerHTML;
        button.disabled = false;
      }
    });
  }
}
