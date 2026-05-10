import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, type Root } from 'react-dom/client';
import type { TimerService } from '../services/timer-service';
import { AreaService } from '../services/area-service';
import { TimerPanel } from './timer-panel';

export const TIMER_PANEL_VIEW_TYPE = 'dayflow-timer';

export class TimerPanelView extends ItemView {
	private root:     Root | null = null;
	private revision  = 0;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly timerService:   TimerService,
		private readonly getDefaultArea: () => string,
		private readonly areaService:    AreaService,
	) {
		super(leaf);
	}

	getViewType():    string { return TIMER_PANEL_VIEW_TYPE; }
	getDisplayText(): string { return 'Timer'; }
	getIcon():        string { return 'clock'; }

	async onOpen(): Promise<void> {
		this.root = createRoot(this.containerEl);
		this.renderRoot();
	}

	async onClose(): Promise<void> {
		this.root?.unmount();
		this.root = null;
	}

	refresh(): void {
		this.revision++;
		this.renderRoot();
	}

	private renderRoot(): void {
		this.root?.render(
			<TimerPanel
				timerService={this.timerService}
				defaultArea={this.getDefaultArea()}
				revision={this.revision}
				areaService={this.areaService}
			/>
		);
	}
}
