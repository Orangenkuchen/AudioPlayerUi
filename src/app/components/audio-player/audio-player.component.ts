import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import * as mm from 'music-metadata-browser';
import { ElementToggle } from '../../../entities/ElementToggle';
import { FileSourceDirective } from '../../directives/FileSource/file-source.directive';

/**
 * Stellt ein AudioElement, welches gerade im aktiven oder inaktiven Audio-Element ist.
 */
interface AudioElement
{
    AudioHtmlElement: HTMLAudioElement;

    AudioFile: File | null;

    AudioMetaDataPromise: Promise<mm.IAudioMetadata> | null;
}

/**
 * Stellt ein Element aus der Warteschlange dar.
 */
interface QueueElement
{
    /**
     * Die Metadaten vom Lied
     */
    AudioMetadataPromise: Promise<mm.IAudioMetadata>

    /**
     * Die Audio-Datei
     */
    File: File;
}

@Component({
    selector: 'app-audio-player',
    standalone: true,
    imports: [CommonModule, FileSourceDirective],
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
    // #endregion

    // #region ctor
    /**
     * Initialisiert die Klasse
     */
    public constructor()
    {
        this.transitionTimeInMs = 30000;

        this.ActiveAudioTags = null;
        this.TrackPictureUrl = null;

        this.TrackQueue = new Array<QueueElement>();
        this.AudioToggle = null;
    }
    // #endregion

    // #region ngOnInit
    /**
     * Wird aufgerufen, wenn die View inistialiert wird.
     */
    public ngOnInit(): void
    {
        let firstAudioElement = document.querySelector<HTMLAudioElement>(".FirstPlayer");
        let secondAudioElement = document.querySelector<HTMLAudioElement>(".SecondPlayer");

        if (firstAudioElement == null || firstAudioElement instanceof HTMLAudioElement == false)
        {
            throw new Error("First audio element was not found or wrong type.");
        }
        if (secondAudioElement == null || secondAudioElement instanceof HTMLAudioElement == false)
        {
            throw new Error("First audio element was not found or wrong type.");
        }

        this.AudioToggle = new ElementToggle<AudioElement>(
            {
                AudioHtmlElement: firstAudioElement,
                AudioMetaDataPromise: null,
                AudioFile: null
            },
            {
                AudioHtmlElement: secondAudioElement,
                AudioMetaDataPromise: null,
                AudioFile: null
            }
        );
    }
    // #endregion

    // #region TrackQueue
    /**
     * Die Warteschlange von ausstehenden Audio-Dateien.
     */
    public readonly TrackQueue: Array<QueueElement>;
    // #endregion

    // #region AudioToggle
    /**
     * Toggle für die Audio-Elemente
     */
    public AudioToggle: ElementToggle<AudioElement> | null;
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

    // #region HandleOnInputFileChanged
    /**
     * Wird augerufen, wenn die Datei(en) im Input sich verändern
     * 
     * @param inputFileChanged Das Change-Event
     */
    public HandleOnInputFileChanged(inputFileChanged: Event): void
    {
        console.info("HandleOnInputFileChanged: Was called...");

        let eventTarget = <HTMLInputElement>inputFileChanged.target;

        if (eventTarget.files != null)
        {
            console.info("HandleOnInputFileChanged: Adding %i Elements to TrackQueue...", eventTarget.files.length);
            for (let i = 0; i < eventTarget.files.length; i++)
            {
                this.TrackQueue.push(
                    {
                        AudioMetadataPromise: mm.parseBlob(eventTarget.files[i]),
                        File: eventTarget.files[i]
                    }
                );
            }

            this.TryFillAudiosFromTrackQueue();
        }
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

        if (this.AudioToggle == null)
        {
            throw new Error("AudioToggle is null")
        }

        if (this.AudioToggle.ActiveElement.AudioHtmlElement == audioElementTarget)
        {
            let remainingTimeInActiveAudio = audioElementTarget.duration - audioElementTarget.currentTime;

            if (remainingTimeInActiveAudio * 1000 < this.transitionTimeInMs)
            {
                let percentageIntoTransition = 1 - (remainingTimeInActiveAudio * 1000) / this.transitionTimeInMs;

                if (this.AudioToggle.InactiveElement.AudioHtmlElement.paused)
                {
                    console.debug("Inaktive Audio is not playing. Starting...");
                    this.AudioToggle.InactiveElement.AudioHtmlElement.play();
                }
                console.debug(`In Transitoin (ActiveVolume: ${1 - percentageIntoTransition}; SecondVolume: ${percentageIntoTransition})...`);

                this.AudioToggle.ActiveElement.AudioHtmlElement.volume = 1 - percentageIntoTransition;
                this.AudioToggle.InactiveElement.AudioHtmlElement.volume = percentageIntoTransition;
            }
            else
            {
                console.debug("Not yet in transition...");
            }
        }
    }
    // #endregion

    // #region HandleOnPlaybackEnded
    /**
     * Wird aufgerufen, wenn das Abspielen von einem AudioElement endet.
     * 
     * @param HandleOnPlaybackEnded Das Event vom Audio-Element, von das Abspielen beendet wurde.
     */
    public HandleOnPlaybackEnded(HandleOnPlaybackEnded: Event): void
    {
        console.info("HandleOnPlaybackEnded: Audio has ended");
        let audioElementTarget = <HTMLAudioElement>HandleOnPlaybackEnded.target;

        if (this.AudioToggle == null)
        {
            throw new Error("AudioToggle is null")
        }

        this.AudioToggle.ActiveElement.AudioFile = null;
        this.AudioToggle.Toggle();

        this.TryFillAudiosFromTrackQueue();
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

    // #region TryFillAudiosFromTrackQueue
    /**
     * Versucht das primäre und sekundäre Audio-Element mit Audio-Dateien aus der Warteschlange zu füllen.
     */
    private TryFillAudiosFromTrackQueue()
    {
        if (this.AudioToggle != null)
        {
            if (this.AudioToggle.ActiveElement.AudioFile == null &&
                this.TrackQueue.length > 0)
            {
                let queueElement = this.TrackQueue.splice(0, 1)[0];

                this.AudioToggle.ActiveElement.AudioFile = queueElement.File;
                this.AudioToggle.ActiveElement.AudioMetaDataPromise = queueElement.AudioMetadataPromise;
            }

            if (this.AudioToggle.InactiveElement.AudioFile == null &&
                this.TrackQueue.length > 0)
            {
                let queueElement = this.TrackQueue.splice(0, 1)[0];

                this.AudioToggle.InactiveElement.AudioFile = queueElement.File;
                this.AudioToggle.InactiveElement.AudioMetaDataPromise = queueElement.AudioMetadataPromise;
            }

            if (this.AudioToggle.ActiveElement.AudioMetaDataPromise != null)
            {
                this.AudioToggle.ActiveElement.AudioMetaDataPromise.then(
                    (tags) => { this.HandleOnMetaDataTagsOfActiveAudioReceived(tags); },
                    (error: any) => { console.error("Error while getting Metadata from Audio-File %o", error) }
                )
            }
        }
    }
    // #endregion
}