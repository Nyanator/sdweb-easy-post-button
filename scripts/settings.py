from modules import script_callbacks, shared


def on_ui_settings():
    shared.opts.add_option("epb_dropbox_client_id", shared.OptionInfo(
        "", "Dropbox Client ID", section=("easy_post_button", "EasyPostButton")))
    shared.opts.add_option("epb_dropbox_client_secret", shared.OptionInfo(
        "", "Dropbox Client Secret", section=("easy_post_button", "EasyPostButton")))
    shared.opts.add_option("epb_dropbox_auth_code", shared.OptionInfo(
        "", "Dropbox Auth Code", section=("easy_post_button", "EasyPostButton")))
    shared.opts.add_option("epb_dropbox_access_token", shared.OptionInfo(
        "", "Dropbox Access Token", section=("easy_post_button", "EasyPostButton")))
    shared.opts.add_option("epb_dropbox_refresh_token", shared.OptionInfo(
        "", "Dropbox Refresh Token", section=("easy_post_button", "EasyPostButton")))


script_callbacks.on_ui_settings(on_ui_settings)
