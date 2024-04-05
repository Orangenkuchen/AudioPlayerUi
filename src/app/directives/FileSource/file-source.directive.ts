import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

/**
 * Erstellt für das File eine temporäre lokale URL und setzte diese im "src" Attribute
 */
@Directive({
    selector: 'audio[appFileSource],img[appFileSource],video[appFileSource]',
    standalone: true
})
export class FileSourceDirective implements OnChanges
{
    // #region fields
    /**
     * Referenz auf das Element, an dem die Directive verwendet wird.
     */
    private elementRef: ElementRef<HTMLAudioElement | HTMLVideoElement | HTMLImageElement>;

    /**
     * Die aktive temporäre Url.
     */
    private activeTemporaryFileUrl: string | null;
    // #endregion

    // #region ctor
    /**
     * Initialisiert die Directive
     * 
     * @param elementRef Referenz auf das Element, an dem die Directive verwendet wird.
     */
    public constructor(elementRef: ElementRef<HTMLAudioElement | HTMLVideoElement | HTMLImageElement>)
    {
        this.elementRef = elementRef;

        this.activeTemporaryFileUrl = null;
        this.FileSource = null;
    }
    // #endreigon

    // #region ngOnChanges
    /**
     * Wird aufgerufen, wenn sich der Wert von der Directive ändert
     * 
     * @param changes Die Werte, welche sich geändert haben
     */
    public ngOnChanges(changes: SimpleChanges): void
    {
        if (this.activeTemporaryFileUrl != null)
        {
            URL.revokeObjectURL(this.activeTemporaryFileUrl);
            this.activeTemporaryFileUrl = null;
        }

        if (this.FileSource != undefined && this.FileSource != null)
        {
            this.activeTemporaryFileUrl = URL.createObjectURL(this.FileSource);
            this.elementRef.nativeElement.setAttribute("src", this.activeTemporaryFileUrl);
        }
        else
        {
            this.elementRef.nativeElement.removeAttribute("src");
        }
    }
    // #endregion

    // #region FileSource
    /**
     * Die Dateien, welche als "src" an das Host-Element angefügt werden soll.
     */
    @Input('appFileSource')
    public FileSource: File | null | undefined;
    // #endregion
}
