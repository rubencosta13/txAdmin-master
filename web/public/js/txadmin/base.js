/* eslint-disable no-unused-vars */
//================================================================
//============================================= Settings & Helpers
//================================================================
//Settings & constants
const REQ_TIMEOUT_SHORT = 1500;
const REQ_TIMEOUT_MEDIUM = 5000;
const REQ_TIMEOUT_LONG = 9000;
const STATUS_REFRESH_INTERVAL = (isWebInterface) ? 1000 : 5000;
const SPINNER_HTML = '<div class="txSpinner">Loading...</div>';

//Helpers
const anyUndefined = (...args) => { return [...args].some((x) => (typeof x === 'undefined')); };
const xss = (x) => {
    let tmp = document.createElement('div');
    tmp.innerText = x;
    return tmp.innerHTML;
};

//================================================================
//================================================= Event Handlers
//================================================================
//Page load
document.addEventListener('DOMContentLoaded', function(event) {
    if (typeof $.notifyDefaults !== 'undefined') {
        $.notifyDefaults({
            z_index: 2000,
            mouse_over: 'pause',
            placement: {
                align: 'center',
            },
            offset: {
                y: 64,
            },
        });
    }

    if (typeof jconfirm !== 'undefined') {
        jconfirm.defaults = {
            title: 'Confirm:',

            draggable: false,
            escapeKey: true,
            closeIcon: true,
            backgroundDismiss: true,

            typeAnimated: false,
            animation: 'scale',

            type: 'red',
            boxWidth: '500px',
            useBootstrap: false,
            theme: document.body.classList.contains('theme--dark') ? 'dark' : 'light',
        };
    }
});

//Handle profile picture load error
const pfpList = document.getElementsByClassName('profile-pic');
for (let pfp of pfpList) {
    pfp.addEventListener('error', () => {
        if (pfp.src != 'img/default_avatar.png') {
            pfp.src = 'img/default_avatar.png';
        }
    });
}


//================================================================
//================================================= Event Handlers
//================================================================
const checkDoLogoutRefresh = (data) => {
    if (data.logout === true) {
        window.location = '/auth?logout';
        return true;
    } else if (data.refresh === true) {
        window.location.reload(true);
        return true;
    }
    return false;
};
//if(checkDoLogoutRefresh(data)) return;

//Must be as close to a JQuery $.ajax() as possible
//TODO: abstract a little bit more and use fetch
//TODO: use the function above for all calls
//NOTE: datatype is the expected return, we can probably remove it
//NOTE: still one $.ajax at setup.html > setFavTemplatesCards
//NOTE: to send json:
//  data: JSON.stringify(data)
//  contentType: 'application/json'
const txAdminAPI = ({type, url, data, dataType, timeout, success, error}) => {
    if (anyUndefined(type, url)) return false;

    url = TX_BASE_PATH + url;
    timeout = timeout || REQ_TIMEOUT_MEDIUM;
    success = success || (() => {});
    error = error || (() => {});
    // console.log(`txAdminAPI Req to: ${url}`);
    return $.ajax({type, url, timeout, data, dataType, success, error});
};

const txAdminConfirm = ({content, confirmBtnClass, modalColor, title}) => {
    return new Promise((resolve, reject) => {
        $.confirm({
            title,
            content: content,
            type: modalColor || 'red',
            buttons: {
                cancel: () => {resolve(false);},
                confirm:  {
                    btnClass: confirmBtnClass || 'btn-red',
                    keys: ['enter'],
                    action: () => {resolve(true);},
                },
            },
            onClose: () => {resolve(false);},
        });
    });
};

const txAdminPrompt = ({confirmBtnClass, modalColor, title, description, placeholder}) => {
    return new Promise((resolve, reject) => {
        $.confirm({
            title,
            type: modalColor || 'green',
            content: `
                <form action="">
                    <div class="form-group">
                        <label>${description}</label>
                        <input type="text" placeholder="${placeholder}" class="inputField form-control" required />
                    </div>
                </form>`,
            buttons: {
                cancel: () => {resolve(false);},
                formSubmit: {
                    text: 'Submit',
                    btnClass: confirmBtnClass || 'btn-green',
                    action: function () {
                        resolve(this.$content.find('.inputField').val());
                    },
                },
            },
            onClose: () => {
                resolve(false);
            },
            onContentReady: function () {
                var jc = this;
                this.$content.find('form').on('submit', function (e) {
                    e.preventDefault();
                    jc.$$formSubmit.trigger('click');
                });
            },
        });
    });
};


//================================================================
//================================================= Darkmode Theme
//================================================================
(function () {
    if (!isWebInterface) return;
    const darkModeCookie = document.cookie.match(/(^| )txAdmin-darkMode=([^;]+)/);

    if (darkModeCookie === null) {
        console.log('no theme cookie found');
        //If the user has Dark Mode as their OS default
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            console.log('OS dark mode detected');
            document.body.classList.toggle('theme--dark');
            document.cookie = 'txAdmin-darkMode=true;path=/';

        //If the user is on desktop
        } else if (window.location.pathname == '/') {
            const darkModeSuggestionCookie = document.cookie.match(/(^| )txAdmin-darkModeSuggestion=([^;]+)/);
            const suggestionInterval = 24 * 60 * 60 * 1000; // every day
            if (darkModeSuggestionCookie === null) {
                const expDate = new Date();
                expDate.setTime(expDate.getTime() + suggestionInterval);

                const darkToggleArea = document.getElementById('darkToggleArea');
                const tooltip = new coreui.Tooltip(darkToggleArea, {
                    container: 'body',
                    boundary: 'window',
                    offset: function offset(_ref) {
                        return [0, _ref.popper.height / 3];
                    },
                });
                setTimeout(() => {
                    tooltip.show();
                    document.cookie = `txAdmin-darkModeSuggestion=true;expires=${expDate.toUTCString()};path=/`;
                }, 2000);
            }
        }
    }

    const hiddenClass = 'd-none';
    let isDarkMode = document.body.classList.contains('theme--dark');

    const toggle1 = document.getElementById('darkToggleDark');
    const toggle2 = document.getElementById('darkToggleLight');
    toggle1.classList.toggle(hiddenClass, isDarkMode);
    toggle2.classList.toggle(hiddenClass, !isDarkMode);

    const handlerFn = function () {
        document.body.classList.toggle('theme--dark');
        toggle1.classList.toggle(hiddenClass);
        toggle2.classList.toggle(hiddenClass);
        isDarkMode = !isDarkMode;
        document.cookie = `txAdmin-darkMode=${isDarkMode};path=/`;
    };

    toggle1.addEventListener('click', handlerFn);
    toggle2.addEventListener('click', handlerFn);
})();
