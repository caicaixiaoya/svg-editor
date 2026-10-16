import { Command } from './Command';
import { SVGDocument } from '../model/SVGDocument';
import { Shape } from '../model/Shape';
import { GroupShape } from '../model/GroupShape';
import { CliError } from '../CliError';

/** create：图形已由工厂构建，这里只负责挂载位置（根或 in 容器）与可逆性。 */
export class CreateCommand extends Command {
  constructor(
    private readonly doc: SVGDocument,
    private readonly shape: Shape,
    private readonly containerId: string | null,
  ) {
    super();
  }

  execute(): string {
    if (this.doc.has(this.shape.id)) throw new CliError(`id already exists: ${this.shape.id}`);
    let parent: GroupShape | null = null;
    if (this.containerId !== null) {
      const container = this.doc.find(this.containerId);
      if (!container) throw new CliError(`no such container: ${this.containerId}`);
      parent = container.asContainer();
      if (!parent) throw new CliError(`not a container: ${this.containerId}`);
    }
    this.doc.attach(this.shape, parent);
    return parent ? `${this.shape.label()} created in ${parent.label()}` : `${this.shape.label()} created`;
  }

  undo(): string {
    this.doc.detach(this.shape);
    return `${this.shape.label()} removed`;
  }
}
