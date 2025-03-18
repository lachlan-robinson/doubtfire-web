// Unit State Component
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {GlobalStateService, ViewType} from 'src/app/projects/states/index/global-state.service';
import {StateService} from '@uirouter/core';
import {Project} from 'src/app/api/models/project';
import {Unit} from 'src/app/api/models/unit';
import {UnitRole} from 'src/app/api/models/unit-role';
import {ProjectService} from 'src/app/api/services/project.service';
import {UnitService} from 'src/app/api/services/unit.service';
import {UserService} from 'src/app/api/services/user.service';
import {AlertService} from 'src/app/common/services/alert.service';

@Component({
  selector: 'f-unit-index-state',
  templateUrl: './unit-index-state.component.html',
})
export class UnitIndexStateComponent implements OnInit {
  unitRole?: UnitRole | null;
  unit?: Unit | null;
  project?: Project | null;

  constructor(
    private state: StateService,
    private globalStateService: GlobalStateService,
    private projectService: ProjectService,
    private unitService: UnitService,
    private userService: UserService,
    private alertService: AlertService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const unitId = this.getUnitId();

    if (!unitId) {
      this.state.go('home');
      return;
    }

    this.globalStateService.onLoad(() => {
      this.unitRole = this.globalStateService.loadedUnitRoles.currentValues.find(
        (unitRole: UnitRole) => unitRole.unit.id === unitId,
      );

      if (
        !this.unitRole &&
        (this.userService.currentUser.role === 'Admin' ||
          this.userService.currentUser.role === 'Auditor')
      ) {
        this.unitRole = this.userService.adminOrAuditorRoleFor(
          this.userService.currentUser.role,
          unitId,
          this.userService.currentUser,
        );
      }

      if (!this.unitRole) {
        this.state.go('home');
        return;
      }

      this.globalStateService.setView('UNIT' as ViewType, this.unitRole);

      this.unitService.get(unitId).subscribe({
        next: (unit) => {
          this.projectService.loadStudents(unit).subscribe({
            next: (students) => {
              this.unit = unit;
            },
            error: (error) => {
              this.alertService.error('Failed to load students');
              setTimeout(() => this.state.go('home'), 5000);
            },
          });
        },
        error: (error) => {
          this.alertService.error('Failed to load unit' + error, 5000);
          setTimeout(() => this.state.go('home'), 5000);
        },
      });
    });
  }

  private getUnitId(): number {
    return +this.route.snapshot.paramMap.get('unitId');
  }
}
