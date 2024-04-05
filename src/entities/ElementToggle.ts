/**
 * Enthält ein aktives Element und ein inaktives Element, welche durch ein Funktion getauscht werden können.
 */
export class ElementToggle<TElement>
{
    // #region fields
    /**
     * Gibt an, ob {@link ElementA} das aktive Element. Wenn true, dann ist {@link ElementB} das inaktive Element.
     */
    private aIsActive: boolean;
    // #endregion

    // #region ctor
    /**
     * Initialisiert die Klasse
     * 
     * @param elementA Das erste (initial aktive) Element
     * @param elementB Das zweite (initial inaktive) Element
     */
    public constructor(elementA: TElement, elementB: TElement)
    {
        this.aIsActive = true;

        this.ElementA = elementA;
        this.ElementB = elementB;
    }
    // #endregion

    // #region ElementA
    /**
     * Das erste Element vom Toggle
     */
    public ElementA: TElement;
    // #endregion

    // #region ElementB
    /**
     * Das zweite Elemente vom Toggle
     */
    public ElementB: TElement;
    // #endregion

    // #region ActiveElement
    /**
     * Das aktive Element vom Toggle. Kann mit {@link ElementToggle.Toggle} geändert werden.
     */
    public get ActiveElement(): TElement
    {
        return this.aIsActive ? this.ElementA : this.ElementB;
    }
    // #endreigon

    // #region InactiveElement
    /**
     * Das inaktive Elemente vom Toggle. Kann mit {@link ElementToggle.Toggle} geändert werden.
     */
    public get InactiveElement(): TElement
    {
        return this.aIsActive ? this.ElementB : this.ElementA;
    }
    // #endregion

    // #region Toggle
    /**
     * Toggled, welches Element aktiv und inaktiv ist.
     */
    public Toggle(): void
    {
        this.aIsActive = this.aIsActive == false;
    }
    // #endregion
}