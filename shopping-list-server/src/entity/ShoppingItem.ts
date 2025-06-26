import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Category } from './Category';

@Entity()
export class ShoppingItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  quantity!: number;

  @ManyToOne(() => Category, category => category.id)
  category!: Category;

  @Column()
  createdAt!: Date;

  @Column({ nullable: true })
  orderId!: string;
}