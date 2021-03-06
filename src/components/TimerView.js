import React, {Component} from "react";
import moment from 'moment';
import CountdownTimer from 'react-awesome-countdowntimer';
import html2canvas from "html2canvas";
import { Dropbox } from 'dropbox';

export class TimerView extends Component {

    constructor() {
        super();

        let d = new Date();
        this.state = {// здесь будем хранить инфу о времени следующего скрина
            nextScreenData: `${d.getDate()}/${(d.getMonth() + 1)}/${d.getFullYear()}`,
            nextScreenTime: `${d.getHours()}:${(d.getMinutes() + 1)}:${d.getSeconds()}`,
            screenshotsCount: 0,// кол-во сделанных скриншотов
            intervalMin: 1,//интервал (в мин)
        };
    }

    componentDidMount() {
        this.initPaint()
    }

    // повторить с интервалом intervalMin минут
    timer = setInterval(() => {
        this.doTask();

        this.changeState(this.state.intervalMin)
    }, 59000);

    doTask = () => {// собственно создание скриншота
        html2canvas(document.body).then(canvas => {
            this.saveScreenshot(canvas.toDataURL('png'))
        });
    }

    saveScreenshot = async (uri) => {
        let img = document.createElement('img');// создаем элемент img, чтоб потом вытащить из него файл типа png
        img.src = uri;
        let file_png = null;

        await fetch(img.src)// вытаскиваем png
            .then(res => res.blob())
            .then(blob => {
                file_png = new File([blob], `Screenshot ${this.state.nextScreenData.replace(/\//g, '-')} at ${this.state.nextScreenTime}.png`, blob);
            });

        this.saveToDbx(file_png)
    }

    saveToDbx = async (file_png) => {
        const dbx = new Dropbox({// подключаемся к dropbox
            accessToken: '',
            fetch
        });

        await dbx.filesUpload({// отправляем на dropbox
            path: `/${file_png.name}`,
            contents: file_png,
            autorename: true
        });
    }

    changeInterval = () => {// изменение интервала
        clearInterval(this.timer);

        let newInterval = document.getElementById('interval').value
        this.changeState(newInterval)

        this.timer = setInterval(() => {
            this.doTask();

            this.changeState(this.state.intervalMin)
        }, newInterval * 59000)
    }

    changeState = (minutes) => {
        let d = new Date();
        d.setMinutes(d.getMinutes() + Number.parseInt(minutes))

        this.setState({// меняем время для след скрина
            nextScreenData: `${d.getDate()}/${(d.getMonth() + 1)}/${d.getFullYear()}`,
            nextScreenTime: `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`,
            screenshotsCount: this.state.screenshotsCount + 1,
            intervalMin: minutes,
        });
    }

    initPaint = () => {// для рисования на форме
        let canvas = document.getElementById("paint")
        let context = canvas.getContext("2d")

        var mouse = {x: 0, y: 0};
        var draw = false;

        canvas.addEventListener("mousedown", function (e) {
            mouse.x = e.pageX - this.offsetLeft;
            mouse.y = e.pageY - this.offsetTop;
            draw = true;
            context.beginPath();
            context.moveTo(mouse.x, mouse.y)
        });
        canvas.addEventListener("mousemove", function (e) {
            if (draw) {
                mouse.x = e.pageX - this.offsetLeft;
                mouse.y = e.pageY - this.offsetTop;
                context.lineTo(mouse.x, mouse.y);
                context.stroke();
            }
        });
        canvas.addEventListener("mouseup", function (e) {
            mouse.x = e.pageX - this.offsetLeft;
            mouse.y = e.pageY - this.offsetTop;
            context.lineTo(mouse.x, mouse.y);
            context.stroke();
            context.closePath();
            draw = false;
        });
    }

    clearCanvas = () => {
        let canvas = document.getElementById("paint")
        let context = canvas.getContext("2d")
        context.clearRect(0, 0, canvas.width, canvas.height)
    }

    render() {
        return (
            <div>
                <pre>Интервал (мин): <input id={'interval'}
                                            type={'number'}
                                            defaultValue={1}/>
                    <input
                        type={'button'}
                        value={'OK'}
                        onClick={this.changeInterval}/>
                </pre>
                <h1>До чих-пых осталось:</h1>
                <CountdownTimer
                    endDate={moment(`${this.state.nextScreenData} ${this.state.nextScreenTime}`, 'DD/MM/YYYY hh:mm:ss')}/>
                <h2>Сохранено скриншотов: {this.state.screenshotsCount}</h2>

                <p>
                    <h3>Ниже можете побаловаться и порисовать:</h3>
                    <button value={'Очистить'} onClick={this.clearCanvas}/>
                </p>
                <canvas id={'paint'} width={'1000px'} height={'500px'} />
            </div>
        );
    }
}
