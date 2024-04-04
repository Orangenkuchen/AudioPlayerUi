import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import * as mm from 'music-metadata-browser';

@Component({
    selector: 'app-audio-player',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './audio-player.component.html',
    styleUrl: './audio-player.component.less'
})
export class AudioPlayerComponent implements OnInit
{
    // #region fields
    /**
     * Die Anzahl der Millisekunden, welche beim Ende eines Lieds, zur anderen überblendet werden soll.
     */
    private readonly transitionTimeInMs: number;

    /**
     * Eine Referenz auf das erste Audio-Element
     */
    private firstAudioElement: HTMLAudioElement | null;

    /**
     * Eine Referenz auf das zweite Audio-Element
     */
    private secondAudioElement: HTMLAudioElement | null;
    // #endregion

    // #region ctor
    /**
     * Initialisiert die Klasse
     */
    public constructor()
    {
        this.transitionTimeInMs = 30000;

        this.firstAudioElement = null;
        this.secondAudioElement = null;

        this.ActiveAudioElement = null;
        this.ActiveAudioTags = null;
        this.TrackPictureUrl = null;

        this.SourceUrlList = new Array<string>();
    }
    // #endregion

    // #region ngOnInit
    /**
     * Wird aufgerufen, wenn die View inistialiert wird.
     */
    public ngOnInit(): void
    {
        this.firstAudioElement = document.querySelector(".FirstPlayer");
        this.secondAudioElement = document.querySelector(".SecondPlayer");
    }
    // #endregion

    // #region ActiveAudioElement
    /**
     * Das aktuelle aktive HTMLAudioElement
     */
    public ActiveAudioElement: HTMLAudioElement | null;
    // #endregion

    // #region ActiveAudioTags
    /**
     * Die Tags vom aktuellen Audio
     */
    public ActiveAudioTags: mm.IAudioMetadata | null;
    // #endregion

    // #region TrackPictureUrl
    /**
     * Die Url von Bild vom aktuellen Track
     */
    public TrackPictureUrl: string | null;
    // #endregion

    // #region SourceUrlList
    /**
     * List von den Urls von den Audio-Quell-Dateien
     */
    public SourceUrlList: Array<string>;
    // #endregion

    // #region HandleOnInputFileChanged
    /**
     * Wird augerufen, wenn die Datei(en) im Input sich verändern
     * 
     * @param inputFileChanged Das Change-Event
     */
    public HandleOnInputFileChanged(inputFileChanged: Event): void
    {
        let eventTarget = <HTMLInputElement>inputFileChanged.target;

        this.SourceUrlList.length = 0;

        if (eventTarget.files != undefined)
        {
            for (let i = 0; i < eventTarget.files?.length; i++)
            {
                let file = eventTarget.files[i];

                let fileObjectUrl = URL.createObjectURL(file);

                this.SourceUrlList.push(fileObjectUrl);
            }
        }

        if (this.firstAudioElement == null || this.secondAudioElement == null)
        {
            throw new Error("Audio-Elements are null")
        }

        this.firstAudioElement.pause();
        this.secondAudioElement.pause();

        this.firstAudioElement.src = this.SourceUrlList[0];
        this.secondAudioElement.src = this.SourceUrlList[1];

        this.firstAudioElement.load();
        this.secondAudioElement.load();

        this.firstAudioElement.play();
        this.ActiveAudioElement = this.firstAudioElement;
        
        mm.fetchFromUrl(this.ActiveAudioElement.src).then(
            (audioTags) => { this.HandleOnMetaDataTagsOfActiveAudioReceived(audioTags); },
            (error) => { console.error("Error while getting audio meta data: %o", error); }
        );
    }
    // #endregion

    // #region HandleOnTimeOfAudioChanged
    /**
     * Wird aufgerufen, wenn sich der Zeitstempel von einem Audio-Element ändert
     * 
     * @param audioTimeChangedEvent Das Event vom Audio-Element, bei dem sich der Zeitstempel geändert hat.
     */
    public HandleOnTimeOfAudioChanged(audioTimeChangedEvent: Event): void
    {
        let audioElementTarget = <HTMLAudioElement>audioTimeChangedEvent.target;

        if (this.firstAudioElement == null || this.secondAudioElement == null)
        {
            throw new Error("Audio-Elements are null")
        }

        if (this.ActiveAudioElement == audioElementTarget)
        {
            let remainingTimeInActiveAudio = audioElementTarget.duration - audioElementTarget.currentTime;

            if (remainingTimeInActiveAudio * 1000 < this.transitionTimeInMs)
            {
                console.info(`Remaining: ${remainingTimeInActiveAudio * 1000}; Transition: ${this.transitionTimeInMs}; % ${(remainingTimeInActiveAudio * 1000) / this.transitionTimeInMs}`)
                let percentageIntoTransition = 1 - (remainingTimeInActiveAudio * 1000) / this.transitionTimeInMs;

                let inactiveAudio = this.firstAudioElement == this.ActiveAudioElement ? this.secondAudioElement : this.firstAudioElement;

                if (inactiveAudio.paused)
                {
                    console.info("Inaktive Audio is not playing. Starting...");
                    inactiveAudio.play();
                }
                console.info(`In Transitoin (ActiveVolume: ${1 - percentageIntoTransition}; SecondVolume: ${percentageIntoTransition})...`);

                this.ActiveAudioElement.volume = 1 - percentageIntoTransition;
                inactiveAudio.volume = percentageIntoTransition;
            }
            else
            {
                console.info("Not yet in transition...");
            }
        }
    }
    // #endregion

    // #region PlaybackEnded
    /**
     * Wird aufgerufen, wenn das Abspielen von einem AudioElement endet.
     * 
     * @param playbackEnded Das Event vom Audio-Element, von das Abspielen beendet wurde.
     */
    public PlaybackEnded(playbackEnded: Event): void
    {
        let audioElementTarget = <HTMLAudioElement>playbackEnded.target;

        if (this.firstAudioElement == null || this.secondAudioElement == null)
        {
            throw new Error("Audio-Elements are null")
        }

        this.ActiveAudioElement = audioElementTarget == this.firstAudioElement ? this.secondAudioElement : this.firstAudioElement;
        console.info("Changeing active Audio-Element to %o", this.ActiveAudioElement);
        
        mm.fetchFromUrl(this.ActiveAudioElement.src).then(
            (audioTags) => { this.HandleOnMetaDataTagsOfActiveAudioReceived(audioTags); },
            (error) => { console.error("Error while getting audio meta data: %o", error); }
        );
    }
    // #endregion

    // #region HandleOnMetaDataTagsOfActiveAudioReceived
    /**
     * Wird aufgerun wenn die Meta-Data-Tags von der aktiven Audio empfangen wird.
     * 
     * @param audioTags Die Meta-Data-Tags von der aktiven Audio
     */
    private HandleOnMetaDataTagsOfActiveAudioReceived(audioTags: mm.IAudioMetadata | null): void
    {
        this.ActiveAudioTags = audioTags;

        if (this.ActiveAudioTags != null &&
            this.ActiveAudioTags.common.picture != null &&
            this.ActiveAudioTags.common.picture.length > 0)
        {
            let blob = new Blob([this.ActiveAudioTags.common.picture[0].data]);

            let url = URL.createObjectURL(blob);
            this.TrackPictureUrl = url;

            setTimeout(
                () => {
                    URL.revokeObjectURL(url);
                },
                1000
            );
        }
    }
    // #endregion
}